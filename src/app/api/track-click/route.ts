import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getServerClient } = await import('@/lib/supabase');
    const supabase = await getServerClient();

    const { data, error } = await supabase
      .from('shopee_clicks')
      .select('id, brand, product_name, clicked_at')
      .order('clicked_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brand, product_name, shopee_url, source } = body;

    if (!brand) {
      return NextResponse.json({ success: false, error: 'No brand' }, { status: 400 });
    }

    const { getServerClient } = await import('@/lib/supabase');
    const supabase = await getServerClient();

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';

    const { error } = await supabase.from('shopee_clicks').insert({
      brand,
      product_name: product_name || null,
      shopee_url: shopee_url || null,
      user_ip: clientIp,
      source: source || null,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
