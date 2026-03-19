'use client';

import { AuthProvider } from '@/lib/auth';
import AdminGuard from '@/components/AdminGuard';
import Sidebar from '@/components/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminGuard>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </AdminGuard>
    </AuthProvider>
  );
}
