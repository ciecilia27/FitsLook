import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { getServerClient } = await import('@/lib/supabase');
    const supabase = await getServerClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json(data || null);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { getServerClient } = await import('@/lib/supabase');
    const supabase = await getServerClient();

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        name: body.name || null,
        email: body.email || null,
        gender: body.gender || null,
        height: body.height ? parseFloat(body.height) : null,
        weight: body.weight ? parseFloat(body.weight) : null,
        chest: body.chest ? parseFloat(body.chest) : null,
        waist: body.waist ? parseFloat(body.waist) : null,
        hip: body.hip ? parseFloat(body.hip) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { getServerClient } = await import('@/lib/supabase');
    const supabase = await getServerClient();

    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: body.name || null,
        gender: body.gender || null,
        height: body.height ? parseFloat(body.height) : null,
        weight: body.weight ? parseFloat(body.weight) : null,
        chest: body.chest ? parseFloat(body.chest) : null,
        waist: body.waist ? parseFloat(body.waist) : null,
        hip: body.hip ? parseFloat(body.hip) : null,
      })
      .eq('email', body.email)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
