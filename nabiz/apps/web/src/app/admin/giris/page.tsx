import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, adminCookieOptions, adminCookieValue, isAdminEnabled, verifyAdminToken } from '@/server/admin-auth';

export const metadata = { robots: { index: false, follow: false } };

async function signIn(formData: FormData) {
  'use server';
  const token = String(formData.get('token') ?? '');
  if (!verifyAdminToken(token)) redirect('/admin/giris?hata=1');

  const value = await adminCookieValue();
  if (value) (await cookies()).set(ADMIN_COOKIE, value, adminCookieOptions);
  redirect('/admin');
}

export default async function AdminLogin({
  searchParams,
}: { searchParams: Promise<{ hata?: string }> }) {
  const { hata } = await searchParams;

  return (
    <main>
      <h1 className="question">Admin girişi</h1>
      {!isAdminEnabled() ? (
        <p className="meta">
          Admin paneli kapalı. Etkinleştirmek için <code>ADMIN_TOKEN</code> ortam değişkenini
          (en az 24 karakter) tanımla.
        </p>
      ) : (
        <form action={signIn} className="card">
          <label className="meta" htmlFor="token">Erişim anahtarı</label>
          <input id="token" name="token" type="password" autoComplete="off"
            style={{ width: '100%', minHeight: 44, marginTop: 8, background: '#1e2430',
                     color: '#fff', border: '1px solid #262d3a', borderRadius: 12, padding: '0 12px' }} />
          {hata && <p className="meta" role="alert">Anahtar hatalı.</p>}
          <div className="actions"><button className="btn primary" type="submit">Giriş</button></div>
        </form>
      )}
    </main>
  );
}
