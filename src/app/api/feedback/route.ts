import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getServerClient } = await import('@/lib/supabase');
    const supabase = await getServerClient();

    const { data, error } = await supabase
      .from('feedback')
      .select('id, name, message, rating, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/admin-guard');
    const denied = await requireAdmin();
    if (denied) {
      return NextResponse.json({ error: denied.error }, { status: denied.status });
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { getAdminClient } = await import('@/lib/supabase');
    const supabase = getAdminClient();

    const { error } = await supabase.from('feedback').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
