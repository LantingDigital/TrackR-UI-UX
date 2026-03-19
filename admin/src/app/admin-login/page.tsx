'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.replace('/admin/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Admin privileges')) {
          setError('Access denied. Admin privileges required.');
        } else if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password')) {
          setError('Invalid email or password.');
        } else if (err.message.includes('auth/user-not-found')) {
          setError('No account found with this email.');
        } else if (err.message.includes('auth/too-many-requests')) {
          setError('Too many attempts. Please try again later.');
        } else {
          setError('Sign in failed. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-section p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              TrackR Admin
            </h1>
            <p className="text-sm text-text-meta mt-1">
              Sign in to manage your app
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 bg-page border border-gray-200 rounded-lg text-text-primary text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                  transition-all duration-150"
                placeholder="caleb@lantingdigital.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 bg-page border border-gray-200 rounded-lg text-text-primary text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                  transition-all duration-150"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-lg
                hover:bg-accent-hover active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-150"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-meta mt-4">
          Admin access only. Contact Caleb for credentials.
        </p>
      </div>
    </div>
  );
}
