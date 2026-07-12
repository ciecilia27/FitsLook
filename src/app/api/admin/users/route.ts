import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/users — list all users with profiles and subscriptions
export async function GET(req: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/admin-guard');
    const denied = await requireAdmin();
    if (denied) {
      return NextResponse.json({ error: denied.error }, { status: denied.status });
    }

    const { getAdminClient } = await import('@/lib/supabase');
    const supabase = getAdminClient();

    // Fetch profiles with their subscriptions
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        subscriptions (
          id, plan, status, started_at, expires_at, created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(profiles || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/users/:userId/subscription — update a user's subscription
export async function PUT(req: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/admin-guard');
    const denied = await requireAdmin();
    if (denied) {
      return NextResponse.json({ error: denied.error }, { status: denied.status });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const body = await req.json();
    const { plan, status, expiresAt } = body;

    const { getAdminClient } = await import('@/lib/supabase');
    const supabase = getAdminClient();

    // Deactivate existing subscriptions first
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Create new subscription
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
