import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "edge"; 

const clean = (value: string | undefined) => (value || "").replace(/["'\r\n\s]/g, "").trim();

function createServerSupabase() {
  // プロデューサーの直感通り、NEXT_PUBLIC_なしの変数を最優先で読み込む！
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
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

  if (supabase) {
    try {
      let query = supabase.from("products").select("*");
      if (keyword && keyword !== "人気") query = query.or(`name.ilike.%${keyword}%,category.ilike.%${keyword}%`);
      if (maxPrice > 0) query = query.lte("price", maxPrice);

      if (sort === "+itemprice") query = query.order("price", { ascending: true });
      else if (sort === "-itemprice") query = query.order("price", { ascending: false });
      else query = query.order("rating", { ascending: false }).order("reviews", { ascending: false });

      const limit = 30;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, error } = await query.range(from, to);

      if (!error && data && data.length > 0) {
        return NextResponse.json({ items: data }, { headers: { "Cache-Control": "no-store" } });
      }
    } catch (e: any) {
      console.error("Supabase API error:", e);
    }
  }

  // 楽天APIフォールバック（IP制限のため空を返すのが基本）
  const appId = clean(process.env.RAKUTEN_APP_ID);
  const accessKey = clean(process.env.RAKUTEN_ACCESS_KEY);
  const affiliateId = clean(process.env.RAKUTEN_AFFILIATE_ID);
  
  if (!appId || !accessKey) {
    return NextResponse.json({ items: [] });
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
    return NextResponse.json({ items: [] });
  }
}