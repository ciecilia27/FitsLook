import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message, rating } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const { getServerClient } = await import('@/lib/supabase');
    const supabase = await getServerClient();

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        name: name || null,
        email: email || null,
        message,
        rating: rating || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
