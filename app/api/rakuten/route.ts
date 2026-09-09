import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const clean = (value: string | undefined) => (value || "").replace(/["'\r\n\s]/g, "").trim();

function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = clean(searchParams.get("keyword") || "人気").slice(0, 128) || "人気";
  const requestedPage = Number(searchParams.get("page") || "1");
  const page = Number.isInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), 100) : 1;
  const maxPrice = Number(searchParams.get("maxPrice") || "0");
  const sort = searchParams.get("sort") || "standard";

  const supabase = createServerSupabase();

  // ==========================================
  // 【ステップ1】まずはSupabaseから爆速で読み込む
  // ==========================================
  if (supabase) {
    try {
      let query = supabase.from("products").select("*");

      // キーワード検索（商品名 または カテゴリ）
      if (keyword && keyword !== "人気") {
        query = query.or(`name.ilike.%${keyword}%,category.ilike.%${keyword}%`);
      }

      // 価格上限の絞り込み
      if (maxPrice > 0) {
        query = query.lte("price", maxPrice);
      }

      // ユーザーの指示通り「高い順」は price DESC に変換
      if (sort === "+itemprice") {
        query = query.order("price", { ascending: true }); // 安い順
      } else if (sort === "-itemprice") {
        query = query.order("price", { ascending: false }); // 高い順
      } else {
        query = query.order("updated_at", { ascending: false }); // おすすめ（新着順）
      }

      // ページネーション（1ページ30件）
      const limit = 30;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      // Supabaseにデータが存在すれば、楽天APIを叩かずに即返す！（無限スクロール対応）
      if (!error && data && data.length > 0) {
        return NextResponse.json({ items: data }, { headers: { "Cache-Control": "no-store" } });
      }
    } catch (e) {
      console.error("Supabase query error:", e);
    }
  }

  // ==========================================
  // 【ステップ2】Supabaseにデータが無い場合のみ楽天APIにフォールバック
  // ==========================================
  const appId = clean(process.env.RAKUTEN_APP_ID);
  const accessKey = clean(process.env.RAKUTEN_ACCESS_KEY);
  const affiliateId = clean(process.env.RAKUTEN_AFFILIATE_ID);

  if (!appId || !accessKey) {
    return NextResponse.json({ success: false, error: "楽天APP IDまたはAccess Keyが設定されていません" }, { status: 500 });
  }

  let rakutenSort = "standard";
  if (sort === "+itemprice") rakutenSort = "+itemPrice";
  if (sort === "-itemprice") rakutenSort = "-itemPrice";

  const params = new URLSearchParams({
    format: "json", keyword, applicationId: appId, accessKey: accessKey,
    page: String(page), hits: "30", imageFlag: "1", sort: rakutenSort
  });
  
  if (affiliateId) params.set("affiliateId", affiliateId);
  if (maxPrice > 0) params.set("maxPrice", String(maxPrice));

  try {
    const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?${params}`;
    const response = await fetch(url, {
      cache: "no-store",
      referrer: "https://dopamine-rush.shop/",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    const payload = await response.json();
    if (!response.ok || !payload.Items) {
      return NextResponse.json({ success: false, error: "楽天APIエラー", details: payload }, { status: 502 });
    }

    const items = payload.Items.map((itemData: any) => {
      const item = itemData.Item || itemData;
      return {
        id: String(item.itemCode), name: String(item.itemName || "商品名不明"), price: Number(item.itemPrice || 0),
        image_url: item.mediumImageUrls?.[0]?.imageUrl?.replace("?_ex=128x128", "") || "", rating: Number(item.reviewAverage || 0),
        reviews: Number(item.reviewCount || 0), delivery: item.asurakuFlag ? "翌日配達可能" : "通常配送",
        shop_name: String(item.shopName || ""), description: String(item.itemCaption || ""),
        url: String(item.itemUrl || ""), category: keyword,
      };
    });

    if (supabase && items.length > 0) {
      await supabase.from("products").upsert(items, { onConflict: "id" });
    }

    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}