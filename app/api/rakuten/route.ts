import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || "人気";
    const page = searchParams.get('page') || "1";
    const sort = searchParams.get('sort') || "standard";
    const maxPrice = searchParams.get('maxPrice');
    const affiliateIdParam = searchParams.get('affiliateId') || "";

    const rakutenAppId = (process.env.RAKUTEN_APP_ID || process.env.NEXT_PUBLIC_RAKUTEN_APP_ID || "").replace(/["']/g, "").trim();
    const rakutenAccessKey = (process.env.RAKUTEN_ACCESS_KEY || process.env.NEXT_PUBLIC_RAKUTEN_ACCESS_KEY || "").replace(/["']/g, "").trim();
    const affiliateId = affiliateIdParam || (process.env.RAKUTEN_AFFILIATE_ID || process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID || "").replace(/["']/g, "").trim();

    if (!rakutenAppId || !rakutenAccessKey) {
      return NextResponse.json({ success: false, error: "楽天のキーが見つかりません" }, { status: 400 });
    }

    // 最新エンドポイント
    let url = `https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601?format=json&keyword=${encodeURIComponent(keyword)}&applicationId=${rakutenAppId}&accessKey=${rakutenAccessKey}&affiliateId=${affiliateId}&page=${page}&sort=${encodeURIComponent(sort)}`;
    
    if (maxPrice && Number(maxPrice) > 0) {
      url += `&maxPrice=${maxPrice}`;
    }
    
    const res = await fetch(url, {
      headers: {
        'Referer': 'https://dopamine-rush.shop', 
        'Origin': 'https://dopamine-rush.shop'
      }
    });
    
    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}