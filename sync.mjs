import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local ファイルが見つかりません。");
  process.exit(1);
}

const envVars = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  if (!line || line.startsWith('#')) return acc;
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const appId = envVars.RAKUTEN_APP_ID;
const accessKey = envVars.RAKUTEN_ACCESS_KEY;
const affiliateId = envVars.RAKUTEN_AFFILIATE_ID;

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

// 楽天の全公式ジャンルを網羅した包括的キーワード
const KEYWORDS = [
  "レディースファッション", "メンズファッション", "靴", "バッグ 小物 ブランド雑貨", 
  "ジュエリー アクセサリー", "腕時計", "インナー 下着 ナイトウェア", 
  "スマートフォン タブレット", "パソコン 周辺機器", "家電", "TV オーディオ カメラ", 
  "食品", "スイーツ お菓子", "水 ソフトドリンク", "ビール 洋酒", "日本酒 焼酎", 
  "インテリア 寝具 収納", "日用品雑貨 文房具 手芸", "キッチン用品 食器 調理器具", 
  "ダイエット 健康", "美容 コスメ 香水", "医薬品 コンタクト 介護", 
  "キッズ ベビー マタニティ", "おもちゃ", "スポーツ アウトドア", 
  "ゴルフ", "車用品 バイク用品", "車 バイク", "本 雑誌 コミック", 
  "CD DVD", "テレビゲーム", "ホビー", "楽器 音響機器", "ペット ペットグッズ", 
  "花 観葉植物", "ガーデン DIY 工具", "サービス リフォーム", "カタログギフト"
];

// 各カテゴリ深く（10ページ=300件）取得して徹底網羅する
const PAGES_PER_KEYWORD = 10; 

async function runSync() {
  console.log("🚀 全ジャンル徹底網羅の密輸を開始します...");
  let totalSaved = 0;

  for (const keyword of KEYWORDS) {
    console.log(`\n🔍 カテゴリ: [ ${keyword} ] を仕入中...`);
    
    for (let page = 1; page <= PAGES_PER_KEYWORD; page++) {
      const params = new URLSearchParams({
        format: "json", keyword, applicationId: appId, accessKey: accessKey,
        page: String(page), hits: "30", imageFlag: "1"
      });
      if (affiliateId) params.set("affiliateId", affiliateId);

      try {
        const url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?${params}`;
        const res = await fetch(url, {
          referrer: "https://dopamine-rush.shop/",
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        
        const data = await res.json();
        
        if (!res.ok || !data.Items || data.Items.length === 0) {
          break; // そのカテゴリにこれ以上商品がなければ次のカテゴリへ
        }

        const items = data.Items.map((itemData) => {
          const item = itemData.Item || itemData;
          return {
            id: String(item.itemCode), name: String(item.itemName || "商品名不明"), price: Number(item.itemPrice || 0),
            image_url: item.mediumImageUrls?.[0]?.imageUrl?.replace("?_ex=128x128", "") || "", rating: Number(item.reviewAverage || 0),
            reviews: Number(item.reviewCount || 0), delivery: item.asurakuFlag ? "翌日配達可能" : "通常配送",
            shop_name: String(item.shopName || ""), description: String(item.itemCaption || ""),
            url: String(item.itemUrl || ""), category: keyword,
          };
        });

        if (items.length > 0) {
          const { error } = await supabase.from("products").upsert(items, { onConflict: "id" });
          if (!error) {
            totalSaved += items.length;
            process.stdout.write(`✅ p${page} `);
          }
        }
      } catch (err) {
        console.error(`エラー: ${err.message}`);
      }
      
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  
  console.log(`\n\n🎉 完了！ 合計 ${totalSaved} 件の商品をSupabaseに格納しました！`);
  process.exit(0);
}

runSync();