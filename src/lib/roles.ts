// Central place for role logic.
// One admin account; everyone else is a regular user.
// Change the admin email here (or set NEXT_PUBLIC_ADMIN_EMAIL in your env).

export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'ciecilia27@gmail.com'
).toLowerCase();

export type Role = 'admin' | 'user';

export function getRole(email: string | null | undefined): Role {
  if (!email) return 'user';
  return email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';
}
