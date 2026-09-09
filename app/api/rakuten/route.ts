import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "edge"; 

// 【修正】Cloudflare Edge環境でクラッシュ(500エラー)しないための安全な取得関数
function safeEnv(key: string) {
  try {
    return (typeof process !== "undefined" && process.env[key]) ? process.env[key] : "";
  } catch (e) {
    return "";
  }
}

const SUPABASE_URL = "https://zugvpxletlutlekskfpk.supabase.co";
// ⚠️↓こちらもANON_KEYの貼り付けをお願いします
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z3ZweGxldGx1dGxla3NrZnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Mjc5NjQsImV4cCI6MjEwNDQwMzk2NH0.qhDqujGh7lClpsfAKdEeFpXpZG0VbKrvgs2j-ZGXiy8";

function createServerSupabase() {
  const url = safeEnv("SUPABASE_URL") || safeEnv("NEXT_PUBLIC_SUPABASE_URL") || SUPABASE_URL;
  const key = safeEnv("SUPABASE_ANON_KEY") || safeEnv("SUPABASE_SERVICE_ROLE_KEY") || safeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || SUPABASE_ANON_KEY;
  
  if (!url || key.includes("ここに")) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = (searchParams.get("keyword") || "人気").replace(/["'\r\n\s]/g, "").trim();
    const page = Number(searchParams.get("page") || "1");
    const maxPrice = Number(searchParams.get("maxPrice") || "0");
    const sort = searchParams.get("sort") || "standard";

    const supabase = createServerSupabase();

    if (supabase) {
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
    }

    const appId = safeEnv("RAKUTEN_APP_ID");
    const accessKey = safeEnv("RAKUTEN_ACCESS_KEY");
    const affiliateId = safeEnv("RAKUTEN_AFFILIATE_ID");
    
    if (!appId || !accessKey) {
      return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
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

    const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?${params}`;
    const response = await fetch(url, {
      cache: "no-store",
      referrer: "https://dopamine-rush.shop/",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });
    
    const payload = await response.json();
    if (!response.ok || !payload.Items) {
      return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
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
  } catch (error: any) {
    // 【修正】いかなるエラーが発生しても絶対に500エラーを出さず、空リストを返してサイトを守る
    console.error("API Error Protected:", error);
    return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}