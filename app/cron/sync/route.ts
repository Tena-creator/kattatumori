import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabaseの接続設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    // ▼ 環境変数から楽天のAPP IDとアフィリエイトIDを取得（既存の/api/rakutenで使っている環境変数名に合わせてください）
    const rakutenAppId = process.env.RAKUTEN_APP_ID || process.env.NEXT_PUBLIC_RAKUTEN_APP_ID || "";
    const affiliateId = process.env.RAKUTEN_AFFILIATE_ID || process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID || "";

    if (!rakutenAppId) {
      return NextResponse.json({ success: false, error: "楽天のAPP IDが見つかりません" }, { status: 400 });
    }

    // ▼ パトロールしてかき集めるキーワード（増やしてもOK）
    const searchKeywords = ["人気ランキング", "ファッション", "コスメ", "日用品", "家電", "食品", "高級時計"];
    let allProducts: any[] = [];

    for (const keyword of searchKeywords) {
      // 楽天APIから30件ずつ引っ張ってくる
      const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?format=json&keyword=${encodeURIComponent(keyword)}&applicationId=${rakutenAppId}&affiliateId=${affiliateId}&hits=30`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.Items) {
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
            category: keyword // 何のキーワードで拾ったかをカテゴリとしてメモ
          };
        });
        allProducts.push(...mapped);
      }
      
      // 楽天APIの連続アクセス制限エラーを防ぐために1秒待つ（超重要！）
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // ▼ 取得した何百件ものデータをSupabaseに一括保存！！
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