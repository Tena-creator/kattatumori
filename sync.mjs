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

const KEYWORDS = [
  "スニーカー", "パンプス", "ブーツ", "サンダル", "Tシャツ", "パーカー", "スウェット",
  "ダウンジャケット", "トレンチコート", "ライダースジャケット", "ワンピース", "カーディガン",
  "デニムパンツ", "ワイドパンツ", "スカート", "スーツ", "ネクタイ", "ワイシャツ",
  "腕時計 メンズ", "腕時計 レディース", "スマートウォッチ", "G-SHOCK",
  "ネックレス", "リング 指輪", "ピアス イヤリング", "ブレスレット",
  "長財布", "折りたたみ財布", "マネークリップ", "トートバッグ", "リュックサック", 
  "ショルダーバッグ", "クラッチバッグ", "スーツケース キャリーバッグ", "サングラス",
  "ノートパソコン", "デスクトップPC", "タブレット", "iPad", "MacBook",
  "ゲーミングモニター", "メカニカルキーボード", "ゲーミングマウス", 
  "ワイヤレスイヤホン", "ヘッドホン", "Bluetoothスピーカー", "サウンドバー",
  "冷蔵庫", "洗濯機", "掃除機 ロボット", "ダイソン 掃除機", "炊飯器", "電子レンジ", 
  "オーブントースター", "エアコン", "空気清浄機", "加湿器", "除湿機",
  "一眼レフ カメラ", "ミラーレス 一眼", "アクションカメラ", "GoPro",
  "ドライヤー", "ヘアアイロン", "電動歯ブラシ", "美顔器", "脱毛器", "シェーバー",
  "プロテイン", "サプリメント", "青汁", "酵素ドリンク",
  "シャンプー トリートメント", "ボディソープ", "洗顔料", "クレンジング",
  "化粧水 乳液", "美容液", "ファンデーション", "リップ 口紅", "香水 フレグランス",
  "洗剤 柔軟剤", "トイレットペーパー", "ティッシュペーパー", "おむつ",
  "ミネラルウォーター", "炭酸水", "コーヒー豆", "お茶 緑茶", "紅茶",
  "ビール", "クラフトビール", "ワイン 赤 白", "シャンパン", "ウイスキー", "日本酒", "焼酎",
  "お米 無洗米", "玄米", "牛肉 焼肉", "すき焼き しゃぶしゃぶ", "豚肉", "鶏肉",
  "海鮮 カニ", "エビ", "ウニ", "いくら", "明太子",
  "フルーツ 桃", "みかん", "りんご", "メロン", "いちご",
  "スイーツ ケーキ", "チョコレート", "クッキー", "和菓子", "アイスクリーム",
  "アウトドア テント", "タープ", "寝袋 シュラフ", "アウトドア チェア", "ランタン",
  "クーラーボックス", "バーベキューコンロ", "焚き火台",
  "自転車 折りたたみ", "電動自転車", "ロードバイク", "クロスバイク",
  "ゴルフクラブ ドライバー", "アイアンセット", "パター", "ゴルフボール", "キャディバッグ",
  "ヨガマット", "ダンベル", "ルームランナー", "フィットネスバイク",
  "釣具 リール", "釣り ロッド", "ルアー", "クーラーボックス 釣り",
  "ボードゲーム", "プラモデル", "ガンプラ", "フィギュア", "トレーディングカード",
  "ラジコン", "鉄道模型", "知育玩具", "レゴ ブロック", "Nintendo Switch", "PS5",
  "ドッグフード", "キャットフード", "ペットシーツ", "猫砂", "キャットタワー",
  "ソファ", "ベッド セミダブル", "マットレス", "ダイニングテーブル", "テレビ台", 
  "本棚", "チェスト", "パソコンデスク", "オフィスチェア",
  "カーテン", "ラグ カーペット", "シーリングライト", "間接照明", "観葉植物 大型",
  "DIY 電動ドリル", "インパクトドライバー", "高圧洗浄機", "塗料 ペンキ", "壁紙 シール",
  "カーナビ", "ドライブレコーダー", "ETC車載器", "タイヤ アルミホイール", 
  "カーアクセサリ", "バイク ヘルメット", "バイク マフラー", "バイク グローブ",
  "ベビーカー", "チャイルドシート", "抱っこ紐", "マタニティ ウェア", "粉ミルク"
];

const PAGES_PER_KEYWORD = 30; 

async function runSync() {
  console.log("🚀 超ビッグデータ複数画像アップグレードを開始します...");
  let totalSaved = 0;

  for (const keyword of KEYWORDS) {
    console.log(`\n🔍 カテゴリ: [ ${keyword} ] を上書き中...`);
    
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
          break; 
        }

        const items = data.Items.map((itemData) => {
          const item = itemData.Item || itemData;
          
          // 【変更】楽天APIの画像配列から最大5枚取得し、カンマで繋ぐ
          const imageUrls = (item.mediumImageUrls || [])
            .map(img => img.imageUrl?.replace("?_ex=128x128", ""))
            .filter(Boolean)
            .slice(0, 5); // 5枚あれば十分なので容量節約

          return {
            id: String(item.itemCode), 
            name: String(item.itemName || "商品名不明"), 
            price: Number(item.itemPrice || 0),
            // ここにカンマ区切りの文字列が入る ("url1,url2,url3")
            image_url: imageUrls.join(",") || "", 
            rating: Number(item.reviewAverage || 0),
            reviews: Number(item.reviewCount || 0), 
            delivery: item.asurakuFlag ? "翌日配達可能" : "通常配送",
            shop_name: String(item.shopName || ""), 
            description: String(item.itemCaption || ""),
            url: String(item.itemUrl || ""), 
            category: keyword,
          };
        });

        if (items.length > 0) {
          // 既存データはIDが一致するため「上書き(upsert)」され、画像URLだけが増える
          const { error } = await supabase.from("products").upsert(items, { onConflict: "id" });
          if (!error) {
            totalSaved += items.length;
            process.stdout.write(`✅ p${page} `);
          } else {
            process.stdout.write(`❌ `);
          }
        }
      } catch (err) {
        process.stdout.write(`⚠️ `);
      }
      
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  
  console.log(`\n\n🎉 完了！ ${totalSaved} 件の商品の複数画像対応アップデートが完了しました！`);
  process.exit(0);
}

runSync();