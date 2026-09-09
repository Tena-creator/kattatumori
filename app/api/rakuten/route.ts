import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare用

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
  // 【ステップ1】Supabaseから読み込む（本番のメイン処理）
  // ==========================================
  if (supabase) {
    try {
      let query = supabase.from("products").select("*");

      if (keyword && keyword !== "人気") {
        query = query.or(`name.ilike.%${keyword}%,category.ilike.%${keyword}%`);
      }

      if (maxPrice > 0) {
        query = query.lte("price", maxPrice);
      }

      if (sort === "+itemprice") {
        query = query.order("price", { ascending: true });
      } else if (sort === "-itemprice") {
        query = query.order("price", { ascending: false });
      } else {
        query = query.order("rating", { ascending: false }).order("reviews", { ascending: false });
      }

      const limit = 30;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error } = await query.range(from, to);

      // Supabaseにデータが存在すれば返す
      if (!error && data && data.length > 0) {
        return NextResponse.json({ items: data }, { headers: { "Cache-Control": "no-store" } });
      }
    } catch (e) {
      console.error("Supabase query error:", e);
    }
  }

  // ==========================================
  // 【ステップ2】楽天APIへのフォールバック
  // ※ Cloudflare(本番)ではIP制限で弾かれるため、エラーを出さずに空の配列を返します。
  // ==========================================
  const appId = clean(process.env.RAKUTEN_APP_ID);
  const accessKey = clean(process.env.RAKUTEN_ACCESS_KEY);
  const affiliateId = clean(process.env.RAKUTEN_AFFILIATE_ID);

  if (!appId || !accessKey) {
    return NextResponse.json({ items: [] }); // エラーにせず空を返す
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
    
    // 【重要】IP制限などで弾かれた場合はエラー画面にせず、安全に空リストを返す
    if (!response.ok || !payload.Items) {
      console.warn("楽天APIへのアクセスが制限されました (CloudflareのIP等)。Supabaseのデータのみを表示します。");
      return NextResponse.json({ items: [] }); 
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
    // 通信エラー時もサイトを壊さない
    return NextResponse.json({ items: [] });
  }
}