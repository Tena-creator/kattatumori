import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ダミーURLを入れてビルドエラーを防ぐ
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const rakutenAppId = process.env.RAKUTEN_APP_ID || process.env.NEXT_PUBLIC_RAKUTEN_APP_ID || "";
    const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID || "";

    if (!rakutenAppId) {
      return NextResponse.json({ success: false, error: "楽天のAPP IDが見つかりません" }, { status: 400 });
    }

    // 原因究明のため、まずは「人気ランキング」だけでテスト
    const keyword = "人気ランキング";
    const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?format=json&keyword=${encodeURIComponent(keyword)}&applicationId=${rakutenAppId}&affiliateId=${affiliateId}&hits=30`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    // ▼ もしItems（商品データ）が取れなかったら、楽天の生のエラーメッセージを画面に出す！
    if (!data.Items) {
      return NextResponse.json({ 
        success: false, 
        message: "楽天APIから商品が返ってきませんでした！", 
        rakutenErrorDetail: data 
      });
    }

    const allProducts = data.Items.map((itemData: any) => {
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

    const { error } = await supabase.from('products').upsert(allProducts, { onConflict: 'id' });
    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `${allProducts.length}件の商品をSupabaseに密輸（同期）完了しました！` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}