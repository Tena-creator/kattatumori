import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const rakutenAppId = (process.env.RAKUTEN_APP_ID || process.env.NEXT_PUBLIC_RAKUTEN_APP_ID || "").replace(/["']/g, "").trim();
    const affiliateId = (process.env.RAKUTEN_AFFILIATE_ID || process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID || "").replace(/["']/g, "").trim();

    if (!rakutenAppId) {
      return NextResponse.json({ success: false, error: "楽天のAPP IDが見つかりません" }, { status: 400 });
    }

    const searchKeywords = ["人気ランキング", "ファッション", "コスメ", "日用品", "家電", "食品", "高級時計"];
    let allProducts: any[] = [];

    for (const keyword of searchKeywords) {
      // ▼ こちらも本来の正しいURLに戻しました
      const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?format=json&keyword=${encodeURIComponent(keyword)}&applicationId=${rakutenAppId}&affiliateId=${affiliateId}&hits=30`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (!data.Items) {
        return NextResponse.json({ success: false, message: "楽天APIエラー", detail: data });
      }

      const mapped = data.Items.map((itemData: any) => {
        const item = itemData.Item;
        return {
          id: item.itemCode,
          name: item.itemName,
          price: item.itemPrice,
          image_url: item.mediumImageUrls?.[0]?.imageUrl?.replace("?_ex=128x128", "") || "",
          rating: item.reviewAverage || 0,
          reviews: item.reviewCount || 0,
          delivery: item.asurakuFlag ? "翌日配達可能" : "通常配送",
          shop_name: item.shopName,
          description: item.itemCaption,
          url: item.itemUrl,
          category: keyword
        };
      });
      allProducts.push(...mapped);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const { error } = await supabase.from('products').upsert(allProducts, { onConflict: 'id' });
    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `${allProducts.length}件の商品をSupabaseに密輸完了しました！` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}