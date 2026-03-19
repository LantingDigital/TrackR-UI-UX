'use client';

import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface StatCard {
  label: string;
  value: number | string;
  loading: boolean;
}

interface RecentReport {
  id: string;
  reporterName: string;
  reportedName: string;
  reason: string;
  status: string;
  createdAt: Date | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: 'Total Users', value: 0, loading: true },
    { label: 'Articles', value: 0, loading: true },
    { label: 'Pending Reports', value: 0, loading: true },
    { label: 'Pro Users', value: 0, loading: true },
  ]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentReports();
  }, []);

  async function loadStats() {
    try {
      const [usersSnap, articlesSnap, reportsSnap, proSnap] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'articles')),
        getCountFromServer(query(collection(db, 'reports'), where('status', '==', 'pending'))),
        getCountFromServer(query(collection(db, 'users'), where('proStatus.active', '==', true))),
      ]);

      setStats([
        { label: 'Total Users', value: usersSnap.data().count, loading: false },
        { label: 'Articles', value: articlesSnap.data().count, loading: false },
        { label: 'Pending Reports', value: reportsSnap.data().count, loading: false },
        { label: 'Pro Users', value: proSnap.data().count, loading: false },
      ]);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setStats((prev) => prev.map((s) => ({ ...s, loading: false, value: '--' })));
    }
  }

  async function loadRecentReports() {
    try {
      const q = query(
        collection(db, 'reports'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(5),
      );
      const snap = await getDocs(q);
      setRecentReports(
        snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            reporterName: data.reporterName ?? 'Unknown',
            reportedName: data.reportedName ?? 'Unknown',
            reason: data.reason ?? '',
            status: data.status ?? 'pending',
            createdAt: data.createdAt?.toDate() ?? null,
          };
        }),
      );
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl shadow-card p-5"
          >
            <p className="text-xs font-medium text-text-meta uppercase tracking-wider">
              {stat.label}
            </p>
            {stat.loading ? (
              <div className="w-12 h-7 bg-page rounded animate-pulse mt-2" />
            ) : (
              <p className="text-2xl font-bold text-text-primary mt-1">
                {stat.value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent reports */}
        <div className="bg-card rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">
              Pending Reports
            </h3>
            <Link
              href="/admin/reports"
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              View all
            </Link>
          </div>
          {loadingReports ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-page rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentReports.length === 0 ? (
            <p className="text-sm text-text-meta py-4 text-center">
              No pending reports
            </p>
          ) : (
            <div className="space-y-2">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href="/admin/reports"
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-page transition-colors"
                >
                  <div>
                    <p className="text-sm text-text-primary">
                      <span className="font-medium">{report.reportedName}</span>
                      {' reported for '}
                      <span className="text-text-secondary">{report.reason}</span>
                    </p>
                    <p className="text-xs text-text-meta">
                      by {report.reporterName}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                    pending
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-card rounded-xl shadow-card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Link
              href="/admin/articles/new"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
            >
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 4v16m8-8H4" />
              </svg>
              <div>
                <p className="text-sm font-medium text-text-primary">New Article</p>
                <p className="text-xs text-text-meta">Create and publish content</p>
              </div>
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-page transition-colors"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <div>
                <p className="text-sm font-medium text-text-primary">Review Reports</p>
                <p className="text-xs text-text-meta">Handle user reports</p>
              </div>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-page transition-colors"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-text-primary">Search Users</p>
                <p className="text-xs text-text-meta">Manage accounts and Pro status</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
