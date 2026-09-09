import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "edge"; 

const clean = (value: string | undefined) => (value || "").replace(/["'\r\n\s]/g, "").trim();

function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// デバッグ用の「エラー商品」を生成する関数
function createErrorItem(id: string, msg: string, desc: string) {
  return {
    id,
    name: msg,
    price: 9999999,
    image_url: "https://placehold.co/600x600/dc2626/ffffff?text=Error",
    rating: 1,
    reviews: 999,
    delivery: "システム通知",
    shop_name: "デバッグ機能",
    description: desc,
    url: "#",
    category: "エラー"
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = clean(searchParams.get("keyword") || "人気").slice(0, 128) || "人気";
  const requestedPage = Number(searchParams.get("page") || "1");
  const page = Number.isInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), 100) : 1;
  const maxPrice = Number(searchParams.get("maxPrice") || "0");
  const sort = searchParams.get("sort") || "standard";

  const supabase = createServerSupabase();

  // エラー1：環境変数が読み込めていない
  if (!supabase) {
    return NextResponse.json({ 
      items: [createErrorItem("err1", "🚨 環境変数が空です", "Cloudflareで環境変数を設定したあと、再デプロイ（Rebuild）されていません。変数が空のためSupabaseに繋がっていません。")] 
    });
  }

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

    // エラー2：RLSなどSupabase側のエラー
    if (error) {
      return NextResponse.json({ 
        items: [createErrorItem("err2", "🚨 Supabaseアクセス拒否", `データベースには繋がりましたが、読み込みが拒否されました。RLSが無効化されているか確認してください。詳細: ${error.message}`)] 
      });
    }

    // データが正常に取れた場合
    if (data && data.length > 0) {
      return NextResponse.json({ items: data }, { headers: { "Cache-Control": "no-store" } });
    }
  } catch (e: any) {
    return NextResponse.json({ items: [createErrorItem("err3", "🚨 Supabase通信エラー", e.message)] });
  }

  // ==========================================
  // Supabaseのデータが0件だった場合のフォールバック
  // ==========================================
  const appId = clean(process.env.RAKUTEN_APP_ID);
  const accessKey = clean(process.env.RAKUTEN_ACCESS_KEY);
  const affiliateId = clean(process.env.RAKUTEN_AFFILIATE_ID);
  
  // エラー4：DBが0件で、楽天APIキーも無い
  if (!appId || !accessKey) {
    return NextResponse.json({ 
      items: [createErrorItem("err4", "🚨 DB0件 ＆ 楽天キーなし", "Supabaseに該当商品が0件で、楽天APIキーも設定されていないため商品が取得できません。")] 
    });
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
    
    // エラー5：楽天APIがCloudflareのIPをブロック
    if (!response.ok || !payload.Items) {
      return NextResponse.json({ 
        items: [createErrorItem("err5", "🚨 楽天API ブロック", "Supabaseに検索した商品が0件です。代わりに楽天APIから取得しようとしましたが、Cloudflareからのアクセスと判定されブロックされました。ローカル環境で「sync.mjs」を実行してDBに商品を蓄積してください。")] 
      });
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

    const supabaseForUpsert = createServerSupabase();
    if (supabaseForUpsert && items.length > 0) {
      await supabaseForUpsert.from("products").upsert(items, { onConflict: "id" });
    }

    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ 
      items: [createErrorItem("err6", "🚨 通信エラー", err.message)] 
    });
  }
}