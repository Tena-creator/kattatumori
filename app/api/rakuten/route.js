import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '高級 グルメ';
  const page = searchParams.get('page') || '1';
  
  // ▼ 新しく「上限金額（maxPrice）」を受け取るようにしました
  const maxPrice = searchParams.get('maxPrice');

  const appId = "9e2af796-b0e3-4e08-9c9d-170a68f5978d";
  
  // ▼ ここにダッシュボードからコピーした「Access Key」を貼り付けてください！
  const accessKey = "pk_RX7fnvPZyQZFQ17KG8FOkBPDBgu42pgmXbDcqfiHzd5"; 

  // 基本のURL
  let targetUrl = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701?format=json&keyword=${encodeURIComponent(keyword)}&applicationId=${appId}&accessKey=${accessKey}&hits=30&page=${page}&imageFlag=1`;

  // ▼ 上限金額が指定されていれば、楽天APIに「〇〇円以下にして！」と条件を追加
  if (maxPrice && maxPrice !== '0') {
    targetUrl += `&maxPrice=${maxPrice}`;
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "Origin": "http://example.com",
        "Referer": "http://example.com"
      }
    });
    const data = await res.json();
    
    if (data.error || data.errors) {
      return NextResponse.json({ "★楽天からのエラー": data, "★送ったURL": targetUrl });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: '通信エラー' }, { status: 500 });
  }
}