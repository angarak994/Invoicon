'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/auth/AuthProvider';
import {
  ArrowRight, FileText, Zap, Shield, Globe, Check,
  Star, ChevronRight, BarChart2, Palette, Download,
  Layout, Users, Clock, Sparkles
} from 'lucide-react';

// ─── Static Data ─────────────────────────────────────────────────────────────

const TEMPLATES = [
  { name: 'Standard Business', color: '#6366f1', emoji: '💼', desc: 'Clean corporate layout for freelancers & agencies' },
  { name: 'Retail & Shop', color: 'var(--brand-color)', emoji: '🛒', desc: 'Optimized for stores with SKU & tax breakdown' },
  { name: 'Restaurant & Food', color: '#f97316', emoji: '🍽️', desc: 'Itemized food sections for cafes & catering' },
  { name: 'Rental Property', color: '#10b981', emoji: '🏠', desc: 'Landlord invoices with property & tenant details' },
  { name: 'Construction', color: '#f59e0b', emoji: '🏗️', desc: 'Contractors with project milestones & materials' },
  { name: 'Professional Services', color: '#3b82f6', emoji: '⚖️', desc: 'Hourly billing for lawyers, doctors & consultants' },
];

const FEATURES = [
  { icon: Layout, title: '9 Industry Templates', desc: 'Professional designs optimized for every business type' },
  { icon: Zap, title: 'Instant PDF Export', desc: 'High-quality PDFs rendered in seconds, every time' },
  { icon: Palette, title: 'Brand Customization', desc: 'Upload your logo, set colors, and add your signature' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your invoices are encrypted and only accessible by you' },
  { icon: BarChart2, title: 'Live Analytics', desc: 'Track revenue, outstanding invoices, and payment trends' },
  { icon: Globe, title: 'Multi-Currency', desc: 'Invoice clients worldwide in their preferred currency' },
  { icon: Download, title: 'Download & Share', desc: 'Share via Gmail, WhatsApp, or download as PDF' },
  { icon: Clock, title: 'Invoice History', desc: 'Full archive with soft-delete, restore, and search' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Freelance Designer', text: 'I went from spending 2 hours on invoices to 5 minutes. The templates are stunning.', rating: 5 },
  { name: 'Raj P.', role: 'Restaurant Owner', text: 'The restaurant template is exactly what I needed. My clients love how professional it looks.', rating: 5 },
  { name: 'Emma T.', role: 'Property Manager', text: 'Managing rental invoices used to be a nightmare. Invoicon made it effortless.', rating: 5 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen bg-[#030712] text-white antialiased overflow-x-hidden">

      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-heading text-2xl font-black tracking-tighter text-[#6366f1] drop-shadow-sm uppercase transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_15px_var(--brand-glow)] hover:brightness-125 cursor-pointer">
              INVOICON
            </span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-400 md:flex">
            <a href="#templates" className="hover:text-white transition-colors">Samples of Invoices</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors sm:block">
              Login
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-xl bg-[#6366f1] px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#5355d6] transition-all"
            >
              Signup
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* Glowing background orbs */}
        <div className="absolute top-20 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-[#6366f1] opacity-[0.12] blur-[130px]" />
        <div className="absolute bottom-20 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-purple-600 opacity-[0.08] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[600px] w-[600px] rounded-full bg-blue-900 opacity-[0.06] blur-[150px]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2 text-xs font-bold tracking-widest text-[#a5b4fc] uppercase">
            <Sparkles className="h-3 w-3" />
            9 Professional Invoice Templates
          </div>

          {/* Headline */}
          <h1 className="font-heading text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Welcome to
            <br />
            <span className="text-[#6366f1]">
              Invoicon
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg font-medium leading-relaxed text-gray-400">
            The most elegant, fully-featured invoice generation platform designed specifically for small to medium businesses. Generate, manage, and share beautifully crafted, industry-specific invoices in seconds. No credit card required to start.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="group flex items-center gap-3 rounded-2xl bg-[#6366f1] px-8 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(99,102,241,0.35)] hover:bg-[#5355d6] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] transition-all duration-300"
            >
              <Zap className="h-5 w-5" />
              Start For Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-2xl border border-white/10 px-8 py-4 text-base font-semibold text-gray-300 hover:border-white/20 hover:text-white transition-all duration-300"
            >
              Login
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-400" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-400" />
              <span>Setup in 60 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
              Everything You Need
            </div>
            <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Invoicing, elevated
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              Every feature you need to look professional and get paid faster.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] p-6 hover:border-white/10 hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#6366f1]/10 ring-1 ring-[#6366f1]/20 group-hover:bg-[#6366f1]/15 transition-colors">
                  <feature.icon className="h-5 w-5 text-[#818cf8]" />
                </div>
                <h3 className="mb-2 text-sm font-bold text-white">{feature.title}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Templates ────────────────────────────────────────────────────── */}
      <section id="templates" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
              Industry Templates
            </div>
            <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              A template for every industry
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              Each template is designed specifically for its industry, optimizing layout, fields, and information hierarchy.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((tpl, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 transition-all duration-300"
                style={{ '--tpl-color': tpl.color } as any}
              >
                <div
                  className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
                  style={{ background: tpl.color }}
                />
                <div className="mb-4 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                    style={{ background: `${tpl.color}15`, border: `1px solid ${tpl.color}30` }}
                  >
                    {tpl.emoji}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                    <span
                      className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: `${tpl.color}20`, color: tpl.color }}
                    >
                      Template
                    </span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-gray-500">{tpl.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#6366f1] px-8 py-4 text-sm font-bold text-white hover:bg-[#5355d6] transition-all"
            >
              Try All Templates Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              From zero to invoice<br />in under 60 seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Choose Your Template', desc: 'Pick an industry-specific template from our gallery. Each one is professionally designed.' },
              { step: '02', title: 'Fill in Details', desc: 'Enter your client info, line items, tax, and any custom fields. The live preview updates instantly.' },
              { step: '03', title: 'Export & Send', desc: 'Download a pixel-perfect PDF or share directly via Gmail or WhatsApp in one click.' },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                {i < 2 && (
                  <div className="absolute top-8 left-full hidden w-full -translate-x-1/2 items-center justify-center sm:flex">
                    <div className="h-px w-24 bg-gradient-to-r from-white/20 to-transparent" />
                  </div>
                )}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#6366f1]/30 bg-[#6366f1]/10">
                  <span className="font-heading text-lg font-black text-[#6366f1]">{step.step}</span>
                </div>
                <h3 className="mb-3 text-base font-bold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Loved by businesses
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-7">
                <div className="mb-4 flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-gray-400">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-gray-600">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Privacy ──────────────────────────────────────────────────────── */}
      <section id="privacy" className="py-24 bg-[#030712]">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-12">
            <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Privacy First
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-400">
              Your data is yours. We encrypt your invoices and client details, ensuring they are only accessible by you. We do not sell your data or use it for advertising.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="relative overflow-hidden rounded-3xl border border-[#6366f1]/20 bg-[#6366f1]/5 px-8 py-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2 text-xs font-bold text-[#a5b4fc]">
                <Users className="h-3 w-3" />
                Join 10,000+ businesses
              </div>
              <h2 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Start invoicing smarter
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-gray-400">
                Create your free account and send your first professional invoice in under 5 minutes. No credit card required.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="flex items-center gap-2 rounded-2xl bg-[#6366f1] px-8 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:bg-[#5355d6] transition-all"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="font-heading text-xl font-black tracking-tighter text-[#6366f1] drop-shadow-sm uppercase transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_15px_var(--brand-glow)] hover:brightness-125 cursor-pointer">
              INVOICON
            </span>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Invoicon. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-gray-600">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
