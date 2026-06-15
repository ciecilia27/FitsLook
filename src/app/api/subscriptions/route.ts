import { NextRequest, NextResponse } from 'next/server';

// GET /api/subscriptions — get current user's active subscription
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const { getAdminClient } = await import('@/lib/supabase');
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/subscriptions — create or update a subscription
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, plan, status, expiresAt } = body;

    if (!userId || !plan) {
      return NextResponse.json({ error: 'userId and plan are required' }, { status: 400 });
    }

    const { getAdminClient } = await import('@/lib/supabase');
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan: plan || 'free',
        status: status || 'active',
        expires_at: expiresAt || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
