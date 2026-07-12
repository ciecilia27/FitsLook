export interface ClickLog {
  id: string;
  brand: string;
  product_name: string;
  clicked_at: number;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  rating: number;
  created_at: string;
}

// Fetch analytics data (click logs + feedback) from the database via API routes
export async function fetchAnalyticsData(): Promise<{ clicks: ClickLog[]; feedbacks: Feedback[] }> {
  const [clicksRes, feedbacksRes] = await Promise.all([
    fetch('/api/track-click').then(r => (r.ok ? r.json() : [])).catch(() => []),
    fetch('/api/feedback').then(r => (r.ok ? r.json() : [])).catch(() => []),
  ]);

  const clicks: ClickLog[] = (Array.isArray(clicksRes) ? clicksRes : []).map((c: any) => ({
    id: c.id,
    brand: c.brand,
    product_name: c.product_name || '',
    clicked_at: new Date(c.clicked_at).getTime(),
  }));

  const feedbacks: Feedback[] = Array.isArray(feedbacksRes) ? feedbacksRes : [];

  return { clicks, feedbacks };
}
