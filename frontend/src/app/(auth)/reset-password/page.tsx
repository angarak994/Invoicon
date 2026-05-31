'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { client } from '@/lib/api/client';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('No reset token found. Please use the link from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);
    try {
      await client.post('/api/v1/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 3500);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        'Failed to reset password. The link may have expired — request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    if (password.length === 0) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' };
    if (score === 2) return { label: 'Fair', color: '#f59e0b', width: '50%' };
    if (score === 3) return { label: 'Good', color: '#10b981', width: '75%' };
    return { label: 'Strong', color: '#01019d', width: '100%' };
  })();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#000000] px-4 py-12">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-80 w-80 rounded-full bg-[var(--brand-color)] opacity-15 blur-[130px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-purple-700 opacity-10 blur-[140px]" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <h2 className="font-heading text-4xl font-black tracking-tighter text-[var(--brand-color)] drop-shadow-sm uppercase mb-2 transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_15px_var(--brand-glow)] hover:brightness-125 cursor-pointer">
            INVOICON
          </h2>
          <h3 className="font-heading text-3xl font-extrabold tracking-tight text-white">
            {success ? 'All Done!' : 'New Password'}
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            {success ? 'Redirecting you to login...' : 'Enter a strong new password for your account.'}
          </p>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl">
          <div className="px-8 py-8 sm:px-10">

            {success ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-2 ring-green-500/20">
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Password Updated!</h3>
                  <p className="mt-1.5 text-sm text-gray-400">
                    Your password has been reset successfully. You'll be redirected to login in a moment.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-[var(--brand-color)] px-6 py-3 text-sm font-bold text-white hover:brightness-110"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Security icon */}
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--brand-color)]/20 bg-[var(--brand-color)]/5 p-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--brand-color)]" />
                  <p className="text-xs text-gray-300">
                    {token
                      ? 'Your reset token has been detected from the email link. Just set your new password below.'
                      : 'No token detected. Please use the reset link sent to your inbox.'}
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-11 pr-12 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-[var(--brand-color)] focus:bg-white/[0.08] focus:ring-2 focus:ring-[var(--brand-color)]/30"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {strength && (
                    <div className="mt-2">
                      <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: strength.width, background: strength.color }}
                        />
                      </div>
                      <p className="mt-1 text-right text-[10px] font-bold" style={{ color: strength.color }}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className={`block w-full rounded-2xl border bg-white/[0.05] py-3.5 pl-11 pr-12 text-sm text-white placeholder-gray-500 outline-none transition-all focus:ring-2 ${
                        confirm && confirm !== password
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                          : confirm && confirm === password
                          ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20'
                          : 'border-white/10 focus:border-[var(--brand-color)] focus:ring-[var(--brand-color)]/30'
                      }`}
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="mt-1.5 text-xs text-red-400">Passwords don't match</p>
                  )}
                  {confirm && confirm === password && (
                    <p className="mt-1.5 text-xs text-green-400">✓ Passwords match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-color)] py-4 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  style={{ boxShadow: '0 4px 20px var(--brand-glow)' }}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span>Set New Password</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-white hover:text-[var(--brand-color)] transition-colors">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-[#000000]">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-color)]" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
