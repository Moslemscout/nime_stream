'use client';

import { useRouter } from 'next/navigation';

export default function AdminLogoutBtn() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  };

  return (
    <button className="admin-logout-btn" onClick={handleLogout}>
      🚪 Logout Admin
    </button>
  );
}
