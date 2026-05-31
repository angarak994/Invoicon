'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { client } from '@/lib/api/client';

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFields = z.infer<typeof loginFormSchema>;

function LoginContent() {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Forgot Password Flow States
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to dashboard or requested page
    if (user) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.replace(redirect);
    }
  }, [user, router, searchParams]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginFields) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await client.post('/api/v1/auth/login', data);
      const { accessToken, user: userProfile } = response.data.data;
      login(accessToken, userProfile);
      
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.replace(redirect);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Invalid email or password combination. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setErrorMsg(null);
    try {
      await client.post('/api/v1/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Could not send recovery link. Verify your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#000000] px-4 py-12 sm:px-6 lg:px-8">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-[var(--brand-color)] opacity-20 blur-[120px] transition-all duration-700"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-purple-600 opacity-15 blur-[140px] transition-all duration-700"></div>

      <div className="w-full max-w-md">
        {/* Logo and Brand Shell Header */}
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="font-heading text-4xl font-black tracking-tighter text-[var(--brand-color)] drop-shadow-sm uppercase transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_15px_var(--brand-glow)] hover:brightness-125 cursor-pointer">
            INVOICON
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Professional invoice drafting made effortless.
          </p>
        </div>

        {/* Dynamic Glassmorphic Core Panel */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl transition-all duration-500 hover:border-white/15">
          <div className="px-8 py-8 sm:px-10">
            
            {errorMsg && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Email Address
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      className="block w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none ring-offset-gray-900 transition-all duration-200 focus:border-[var(--brand-color)] focus:bg-white/[0.08] focus:ring-2 focus:ring-[var(--brand-color)]/30"
                      placeholder="you@domain.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs font-medium text-[var(--brand-color)] hover:underline hover:brightness-125 transition-all duration-200"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="block w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-11 pr-12 text-sm text-white placeholder-gray-500 outline-none ring-offset-gray-900 transition-all duration-200 focus:border-[var(--brand-color)] focus:bg-white/[0.08] focus:ring-2 focus:ring-[var(--brand-color)]/30"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-color)] py-4 text-sm font-semibold text-white shadow-lg transition-all duration-150 hover:brightness-110 border-b-4 border-black/20 active:border-b-0 active:translate-y-1 disabled:pointer-events-none disabled:opacity-50"
                  style={{ boxShadow: '0 4px 20px var(--brand-glow)' }}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Enter Workspace</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <div className="text-center">
                  <h3 className="font-heading text-lg font-bold text-white">Reset Password</h3>
                  <p className="mt-1.5 text-xs text-gray-400">
                    We will email you a secure token link to recover your access.
                  </p>
                </div>

                {forgotSuccess ? (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-5 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400 animate-bounce" />
                    <h4 className="mt-3 text-sm font-bold text-white">Check Your Email</h4>
                    <p className="mt-1.5 text-xs text-gray-400">
                      A password reset link has been sent to <span className="font-semibold text-white">{forgotEmail}</span>. Click the link in the email to set a new password.
                    </p>
                    <p className="mt-2 text-xs text-gray-500">The link expires in 1 hour.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Register Email Address
                      </label>
                      <div className="relative mt-2">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                          <Mail className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                          required
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="block w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none ring-offset-gray-900 transition-all duration-200 focus:border-[var(--brand-color)] focus:bg-white/[0.08] focus:ring-2 focus:ring-[var(--brand-color)]/30"
                          placeholder="you@domain.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-color)] py-4 text-sm font-semibold text-white shadow-lg transition-all duration-150 hover:brightness-110 border-b-4 border-black/20 active:border-b-0 active:translate-y-1 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span>Send Recovery Email</span>
                      )}
                    </button>
                  </>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

        {/* Footer Navigation */}
        {mode === 'login' && (
          <p className="mt-8 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-white hover:text-[var(--brand-color)] hover:underline hover:brightness-125 transition-all duration-200"
            >
              Sign up today
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#000000]">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-color)]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
