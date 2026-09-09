import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const clean = (value: string | undefined) => (value || "").replace(/["'\r\n\s]/g, "").trim();

// ▼ ドーパミン全開！キーワードを大幅に拡張
const SEARCH_KEYWORDS = [
  "人気", "ファッション", "コスメ", "日用品", "家電", "食品", "高級時計",
  "ジュエリー", "ブランドバッグ", "パソコン", "ゲーム機", "お取り寄せスイーツ",
  "高級肉", "ワイン", "車", "キャンプ用品", "ゴルフ", "インテリア","純金", "クルーザー", "タワーマンション", "高級ワイン", "ロレックス",
  "エルメス バーキン", "ゲーミングPC", "高級家具", "松阪牛 牛肉", "ふるさと納税",
  "純金", "24金 インゴット", "ダイヤモンド ネックレス", "プラチナ リング",
  "ロレックス", "オメガ", "オーデマピゲ", "パテックフィリップ",
  "エルメス バーキン", "シャネル マトラッセ", "ハリーウィンストン",
  "クルーザー", "キャンピングカー", "スーパーカー", "ガレージハウス",
  "松阪牛 シャトーブリアン", "神戸牛 ブロック", "A5ランク 黒毛和牛",
  "キャビア", "白トリュフ", "最高級 国産 松茸", "タラバガニ 特大",
  "ロマネコンティ", "ドンペリニヨン", "オーパスワン", "響 30年", "山崎 25年",
  "ゲーミングPC RTX4090", "有機ELテレビ 85インチ", "ホームシアター システム",
  "ライカ デジタルカメラ", "一眼レフ レンズセット", "ドローン 4K",
  "ロードバイク カーボン", "スノーピーク テント", "家庭用 サウナ", "全自動 麻雀卓",
  "美顔器 最新", "高級 ドライヤー", "脱毛器 業務用", 
  "SK-II 化粧水", "クレ・ド・ポー ボーテ", "高級 香水",
  "等身大 フィギュア", "甲冑", "隕石", "恐竜 化石", "純金 茶釜", "業務用 わたあめ機",
  "人気", "ファッション", "コスメ", "日用品", "家電", "食品"
];

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const appId = clean(process.env.RAKUTEN_APP_ID);
  const accessKey = clean(process.env.RAKUTEN_ACCESS_KEY);
  const affiliateId = clean(process.env.RAKUTEN_AFFILIATE_ID);

  if (!supabaseUrl || !serviceRoleKey || !appId || !accessKey) {
    return NextResponse.json({ success: false, error: "環境変数が不足しています" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  
  const products: any[] = [];
  const failures: any[] = [];

  // ▼ 1キーワードあたり何ページ取得するか（例: 3ページ = 90件）
  const PAGES_PER_KEYWORD = 3;

  for (const keyword of SEARCH_KEYWORDS) {
    for (let page = 1; page <= PAGES_PER_KEYWORD; page++) {
      const params = new URLSearchParams({ 
          format: "json", keyword, applicationId: appId, accessKey: accessKey, 
          hits: "30", imageFlag: "1", page: String(page) // ページ数を指定
      });
      if (affiliateId) params.set("affiliateId", affiliateId);

      try {
        const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?${params}`;

        const response = await fetch(url, { 
            cache: "no-store",
            referrer: "https://dopamine-rush.shop/",
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        const payload = await response.json();
        
        if (!response.ok || !payload.Items) {
          failures.push({ keyword, page, error: payload });
        } else {
          products.push(...payload.Items.map((itemData: any) => {
            const item = itemData.Item || itemData;
            return {
              id: String(item.itemCode), name: String(item.itemName || "商品名不明"), price: Number(item.itemPrice || 0),
              image_url: item.mediumImageUrls?.[0]?.imageUrl?.replace("?_ex=128x128", "") || "", rating: Number(item.reviewAverage || 0),
              reviews: Number(item.reviewCount || 0), delivery: item.asurakuFlag ? "翌日配達可能" : "通常配送",
              shop_name: String(item.shopName || ""), description: String(item.itemCaption || ""),
              url: String(item.itemUrl || ""), category: keyword,
            };
          }));
        }
      } catch (err: any) {
        failures.push({ keyword, page, exception: err.message });
      }
      
      // 楽天APIの連続アクセス制限（1秒に1回）を回避するため、必ず1秒待つ
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (products.length === 0) {
    return NextResponse.json({ success: false, error: "楽天APIエラー", details: failures }, { status: 502 });
  }

  const uniqueProducts = Array.from(new Map(products.map((p) => [p.id, p])).values());
  const { error } = await supabase.from("products").upsert(uniqueProducts, { onConflict: "id" });
  
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, synced: uniqueProducts.length, failures });
}