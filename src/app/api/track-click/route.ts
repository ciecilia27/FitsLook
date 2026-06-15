import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brand, product_name, shopee_url, source } = body;

    if (!brand) {
      return NextResponse.json({ success: false, error: 'No brand' }, { status: 400 });
    }

    // Try Supabase first
    try {
      const { getServerClient } = await import('@/lib/supabase');
      const supabase = await getServerClient();

      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

      await supabase.from('shopee_clicks').insert({
        brand,
        product_name: product_name || null,
        shopee_url: shopee_url || null,
        user_ip: clientIp,
        source: source || null,
      });

      return NextResponse.json({ success: true });
    } catch {
      // Supabase failed — fallback to localStorage is client-side
      return NextResponse.json({ success: true, note: 'Saved locally' });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
