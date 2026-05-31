'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { client } from '@/lib/api/client';

const signupFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

type SignupFields = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Real-time password criteria trackers
  const [passwordValue, setPasswordValue] = useState('');
  
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFields>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const passwordWatch = watch('password');
  useEffect(() => {
    setPasswordValue(passwordWatch || '');
  }, [passwordWatch]);

  const onSubmit = async (data: SignupFields) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      console.log('Signup payload:', data);
      await client.post('/api/v1/auth/signup', data);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Something went wrong during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#000000] px-4 py-12 sm:px-6 lg:px-8">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-[var(--brand-color)] opacity-20 blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-purple-600 opacity-15 blur-[140px]"></div>

      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="font-heading text-4xl font-black tracking-tighter text-[var(--brand-color)] drop-shadow-sm uppercase mb-2 transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_15px_var(--brand-glow)] hover:brightness-125 cursor-pointer">
            INVOICON
          </h2>
          <h3 className="font-heading text-2xl font-bold tracking-tight text-white">
            Create Account
          </h3>
          <p className="mt-2 text-sm text-gray-400">
            Join Invoicon and generate invoices under seconds.
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

            {success ? (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Registration Successful!</h4>
                  <p className="mt-2 text-xs text-gray-400">
                    We&apos;ve registered your account successfully. Redirecting you to sign in...
                  </p>
                </div>
                <div className="flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-color)]" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Full Name
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      {...register('name')}
                      type="text"
                      className="block w-full rounded-2xl border border-white/10 bg-white/[0.05] py-3.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 outline-none ring-offset-gray-900 transition-all duration-200 focus:border-[var(--brand-color)] focus:bg-white/[0.08] focus:ring-2 focus:ring-[var(--brand-color)]/30"
                      placeholder="Alex Mercer"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
                  )}
                </div>

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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Password
                  </label>
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
                  
                  {/* Real-time feedback guides */}
                  <div className="mt-3 space-y-1.5 rounded-2xl bg-white/[0.02] border border-white/5 p-3.5">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Complexity Guide</p>
                    <div className="grid grid-cols-1 gap-1 text-[11px]">
                      <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                        At least 8 characters
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasUppercase ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${hasUppercase ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                        One uppercase letter (A-Z)
                      </span>
                      <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${hasNumber ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                        One numerical digit (0-9)
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-color)] py-4 text-sm font-semibold text-white shadow-lg transition-all duration-150 hover:brightness-110 border-b-4 border-black/20 active:border-b-0 active:translate-y-1 disabled:pointer-events-none disabled:opacity-50"
                  style={{ boxShadow: '0 4px 20px var(--brand-glow)' }}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Generate Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>

        {/* Footer Navigation */}
        {!success && (
          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-white hover:text-[var(--brand-color)] hover:underline hover:brightness-125 transition-all duration-200"
            >
              Sign in here
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
