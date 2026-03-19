'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedName: string;
  reason: string;
  details: string | null;
  contentId: string | null;
  contentType: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  resolution: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  reviewed: 'bg-blue-50 text-blue-700',
  resolved: 'bg-green-50 text-green-700',
  dismissed: 'bg-gray-100 text-text-meta',
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  'inappropriate-content': 'Inappropriate Content',
  impersonation: 'Impersonation',
  other: 'Other',
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReports(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            reporterId: data.reporterId ?? '',
            reporterName: data.reporterName ?? 'Unknown',
            reportedUserId: data.reportedUserId ?? '',
            reportedName: data.reportedName ?? 'Unknown',
            reason: data.reason ?? '',
            details: data.details ?? null,
            contentId: data.contentId ?? null,
            contentType: data.contentType ?? null,
            status: data.status ?? 'pending',
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
            reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt.toDate() : null,
            reviewedBy: data.reviewedBy ?? null,
            resolution: data.resolution ?? null,
          };
        }),
      );
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(reportId: string, resolution: 'resolved' | 'dismissed') {
    setActionLoading(reportId);
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: resolution,
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid ?? null,
        resolution,
      });
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: resolution, reviewedAt: new Date(), reviewedBy: user?.uid ?? null, resolution }
            : r,
        ),
      );
    } catch (err) {
      console.error('Failed to update report:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBlockUser(reportId: string, userId: string) {
    setActionLoading(reportId);
    try {
      const blockUser = httpsCallable(functions, 'blockUser');
      await blockUser({ blockedUserId: userId });
      await handleResolve(reportId, 'resolved');
    } catch (err) {
      console.error('Failed to block user:', err);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = reports.filter((r) => filter === 'all' || r.status === filter);

  function formatDate(date: Date | null) {
    if (!date) return '--';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Reports</h2>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-card rounded-lg p-1 shadow-card w-fit">
        {(['pending', 'all', 'resolved', 'dismissed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150
              ${filter === f
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary'
              }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">
              {reports.filter((r) => f === 'all' || r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl shadow-card p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-page rounded mb-2" />
              <div className="h-3 w-1/2 bg-page rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl shadow-card p-12 text-center">
          <p className="text-text-meta text-sm">
            {filter === 'pending' ? 'No pending reports.' : 'No reports found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div
              key={report.id}
              className="bg-card rounded-xl shadow-card p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[report.status]}`}>
                      {report.status}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                  </div>

                  <p className="text-sm text-text-primary">
                    <span className="font-semibold">{report.reportedName}</span>
                    <span className="text-text-secondary">
                      {' '}reported by{' '}
                    </span>
                    <span className="font-medium">{report.reporterName}</span>
                  </p>

                  {report.details && (
                    <p className="text-sm text-text-secondary mt-1 bg-page rounded-lg px-3 py-2">
                      {report.details}
                    </p>
                  )}

                  <p className="text-xs text-text-meta mt-2">
                    {formatDate(report.createdAt)}
                    {report.reviewedAt && (
                      <span> · Reviewed {formatDate(report.reviewedAt)}</span>
                    )}
                  </p>
                </div>

                {report.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolve(report.id, 'dismissed')}
                      disabled={actionLoading === report.id}
                      className="px-3 py-1.5 text-xs font-medium text-text-secondary
                        bg-page rounded-lg hover:text-text-primary
                        disabled:opacity-50 transition-all duration-150"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleResolve(report.id, 'resolved')}
                      disabled={actionLoading === report.id}
                      className="px-3 py-1.5 text-xs font-medium text-white
                        bg-accent rounded-lg hover:bg-accent-hover
                        disabled:opacity-50 transition-all duration-150"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleBlockUser(report.id, report.reportedUserId)}
                      disabled={actionLoading === report.id}
                      className="px-3 py-1.5 text-xs font-medium text-red-600
                        bg-red-50 rounded-lg hover:bg-red-100
                        disabled:opacity-50 transition-all duration-150"
                    >
                      Block User
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
