'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Clock, 
  FileText, 
  Trash2, 
  Plus, 
  FileSignature,
  ChevronRight,
  Loader2,
  Settings
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { client } from '@/lib/api/client';
import { useAuth } from '@/auth/AuthProvider';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  total: number; // in cents
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  issueDate: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState({
    lifetimeRevenue: 0,
    outstandingDues: 0,
    draftCount: 0,
    archivedCount: 0
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await client.get('/api/v1/invoices');
        const invoicesList: Invoice[] = (response.data.data || []).map((inv: any) => ({
          ...inv,
          clientName: inv.clientName || inv.toName || '',
          issueDate: inv.issueDate || inv.invoiceDate || '',
          dueDate: inv.dueDate || ''
        }));
        setInvoices(invoicesList);

        // Compute metrics
        let totalRevenue = 0;
        let unpaid = 0;
        let drafts = 0;
        let archived = 0;

        invoicesList.forEach((inv) => {
          if (inv.status === 'paid') {
            totalRevenue += inv.total;
          } else if (inv.status === 'sent' || inv.status === 'overdue') {
            unpaid += inv.total;
          } else if (inv.status === 'draft') {
            drafts += 1;
          }
        });

        // Fetch trash count as archived count
        try {
          const trashRes = await client.get('/api/v1/invoices/trash');
          archived = (trashRes.data.data || []).length;
        } catch (e) {
          console.error('Error fetching trash count for stats:', e);
        }

        setStats({
          lifetimeRevenue: totalRevenue / 100, // convert cents to currency units
          outstandingDues: unpaid / 100,
          draftCount: drafts,
          archivedCount: archived
        });

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    const maps: Record<string, { bg: string; text: string }> = {
      paid: { bg: 'bg-green-500/10 text-green-500 border-green-500/20', text: 'Paid' },
      sent: { bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20', text: 'Sent' },
      draft: { bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20', text: 'Draft' },
      overdue: { bg: 'bg-red-500/10 text-red-500 border-red-500/20', text: 'Overdue' }
    };
    const c = maps[status] || maps.draft;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${c.bg}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
        {c.text}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.defaultCurrency || 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-color)]" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Compiling financial workspace...</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Paid', value: stats.lifetimeRevenue, color: '#22c55e' }, // green-500
    { name: 'Outstanding', value: stats.outstandingDues, color: '#ef4444' }, // red-500
    { name: 'Drafts', value: stats.draftCount > 0 ? stats.draftCount * 10 : 0, color: '#f59e0b' }, // amber-500 - placeholder value if no revenue
  ].filter(d => d.value > 0);

  // If there's absolutely no data, provide an empty state slice
  if (pieData.length === 0) {
    pieData.push({ name: 'No Data', value: 1, color: '#e5e7eb' }); // gray-200
  }

  return (
    <div className="space-y-10">
      
      {/* Greeting Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-heading text-xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
              Welcome back, {user?.name.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor invoices, calculate earnings, and track dues dynamically.
            </p>
          </div>
        </div>
        
        <Link 
          href="/invoices/new"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-color)] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-150 hover:brightness-110 border-b-4 border-black/20 active:border-b-0 active:translate-y-1"
          style={{ boxShadow: '0 4px 16px var(--brand-glow)' }}
        >
          <Plus className="h-4 w-4" />
          <span>Draft New Invoice</span>
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Lifetime Revenue */}
        <div className="group rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm transition-all duration-300 hover:border-[var(--brand-color)]/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Lifetime Revenue</span>
            <div className="rounded-2xl bg-green-500/10 p-2.5 text-green-500">
              <TrendingUp className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-heading text-2xl font-black text-gray-900 dark:text-white sm:text-3xl leading-none">
              {formatCurrency(stats.lifetimeRevenue)}
            </h3>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-green-500">
              Paid invoices total
            </span>
          </div>
        </div>

        {/* Card 2: Outstanding Dues */}
        <div className="group rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm transition-all duration-300 hover:border-[var(--brand-color)]/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Outstanding Dues</span>
            <div className="rounded-2xl bg-red-500/10 p-2.5 text-red-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-heading text-2xl font-black text-gray-900 dark:text-white sm:text-3xl leading-none">
              {formatCurrency(stats.outstandingDues)}
            </h3>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-500">
              Sent & Overdue dues
            </span>
          </div>
        </div>

        {/* Card 3: Draft Documents */}
        <div className="group rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm transition-all duration-300 hover:border-[var(--brand-color)]/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Draft Invoices</span>
            <div className="rounded-2xl bg-amber-500/10 p-2.5 text-amber-500">
              <FileSignature className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-heading text-2xl font-black text-gray-900 dark:text-white sm:text-3xl leading-none">
              {stats.draftCount}
            </h3>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
              Unissued document drafts
            </span>
          </div>
        </div>

        {/* Card 4: Trash Bin */}
        <div className="group rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm transition-all duration-300 hover:border-[var(--brand-color)]/30 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Trash Bin</span>
            <div className="rounded-2xl bg-gray-500/10 p-2.5 text-gray-500 dark:text-gray-400">
              <Trash2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-heading text-2xl font-black text-gray-900 dark:text-white sm:text-3xl leading-none">
              {stats.archivedCount}
            </h3>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
              Soft-deleted documents
            </span>
          </div>
        </div>

      </div>

      {/* Main Content Layout Block: Dynamic Graph & Table */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* SVG Sales Trend Chart Card */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-5">
            <div>
              <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">Revenue Trend</h3>
              <p className="text-xs text-gray-400 mt-1">Invoice totals across your workspace.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                <span>Paid: {formatCurrency(stats.lifetimeRevenue)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                <span>Outstanding: {formatCurrency(stats.outstandingDues)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 h-[250px] w-full">
            {pieData.length > 0 && pieData[0].name !== 'No Data' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      name === 'Drafts' ? (Number(value) / 10) + ' Invoices' : formatCurrency(Number(value)), 
                      name
                    ]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#1f2937', color: '#f9fafb' }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                <TrendingUp className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                <p className="text-xs font-semibold text-gray-400 mt-2">Create invoices to see your revenue breakdown here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick-Draft helper list */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm">
          <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-5">
            Quick Actions
          </h3>
          <div className="mt-5 space-y-4">
            
            <Link 
              href="/invoices/new" 
              className="flex items-center gap-4 rounded-2xl border border-gray-150 dark:border-gray-800 p-4 transition-all duration-200 hover:border-[var(--brand-color)]/30 hover:bg-gray-50 dark:hover:bg-gray-900/30"
            >
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Create Invoice</h4>
                <p className="text-xs text-gray-400 mt-0.5">Quickly issue brand drafts</p>
              </div>
            </Link>

            <Link 
              href="/settings" 
              className="flex items-center gap-4 rounded-2xl border border-gray-150 dark:border-gray-800 p-4 transition-all duration-200 hover:border-[var(--brand-color)]/30 hover:bg-gray-50 dark:hover:bg-gray-900/30"
            >
              <div className="rounded-xl bg-[var(--brand-color)]/10 p-2.5 text-[var(--brand-color)]">
                <Settings className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Theme & Settings</h4>
                <p className="text-xs text-gray-400 mt-0.5">Live brand color customization</p>
              </div>
            </Link>

          </div>
        </div>

      </div>

      {/* Recent Invoices Data Grid */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-5">
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <p className="text-xs text-gray-400 mt-1">Your 5 most recently created invoices.</p>
          </div>
          <Link 
            href="/invoices"
            className="flex items-center gap-1 text-xs font-bold text-[var(--brand-color)] hover:underline"
          >
            <span>View All Invoices</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto">
          {invoices.length > 0 ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-4">Invoice #</th>
                  <th className="py-4 px-4">Client</th>
                  <th className="py-4 px-4">Issue Date</th>
                  <th className="py-4 px-4">Due Date</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {invoices.slice(0, 5).map((inv) => (
                  <tr 
                    key={inv._id}
                    className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors duration-150"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-gray-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      {inv.clientName}
                    </td>
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(inv.total / 100)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Link
                        href={`/invoices/new?id=${inv._id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-color)] bg-[var(--brand-color)]/5 hover:bg-[var(--brand-color)]/10 px-3 py-1.5 rounded-xl transition-colors duration-150"
                      >
                        <span>Edit</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12 px-6">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 mb-4">
                <FileText className="h-7 w-7 text-gray-400" />
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">No Invoices Issued</h4>
              <p className="text-xs text-gray-400 mt-1.5 max-w-sm">
                Get started by creating your very first professional, dynamic invoice with interactive calculations.
              </p>
              <Link 
                href="/invoices/new"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--brand-color)] px-5 py-3 text-xs font-bold text-white shadow-sm transition-all duration-150 hover:brightness-110 border-b-4 border-black/20 active:border-b-0 active:translate-y-1"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Invoice</span>
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
