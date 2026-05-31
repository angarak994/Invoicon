'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Loader2, 
  FileText,
  Clock,
  Trash
} from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuth } from '@/auth/AuthProvider';

interface TrashedInvoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  deletedAt: string;
}

export default function TrashHub() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trashedInvoices, setTrashedInvoices] = useState<TrashedInvoice[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTrashList = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/api/v1/invoices/trash');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedTrashed = (data.data || []).map((inv: any) => ({
        ...inv,
        clientName: inv.clientName || inv.toName || ''
      }));
      setTrashedInvoices(mappedTrashed);
    } catch (err) {
      console.error('Failed to load trash list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestore = async (id: string) => {
    setActionLoading(`${id}-restore`);
    try {
      await client.post(`/api/v1/invoices/trash/${id}/restore`);
      setTrashedInvoices((prev) => prev.filter((i) => i._id !== id));
      alert('Invoice restored successfully!');
    } catch (err) {
      alert('Failed to restore invoice.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('CAUTION: This action is permanent and cannot be undone. Are you sure you want to permanently delete this invoice?')) return;
    setActionLoading(`${id}-permanent`);
    try {
      await client.delete(`/api/v1/invoices/trash/${id}/permanent`);
      setTrashedInvoices((prev) => prev.filter((i) => i._id !== id));
      alert('Invoice permanently deleted from database.');
    } catch (err) {
      alert('Failed to permanently delete invoice.');
    } finally {
      setActionLoading(null);
    }
  };

  const calculateDaysLeft = (deletedAtStr: string) => {
    const deletedAtDate = new Date(deletedAtStr);
    const purgeDate = new Date(deletedAtDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days later
    const now = new Date();
    
    const diffTime = purgeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.defaultCurrency || 'USD'
    }).format(amount / 100);
  };

  if (loading && trashedInvoices.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-color)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Trash Control Center
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Soft-deleted items reside here. Draft data will be permanently purged after a 30-day period.
        </p>
      </div>

      <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm overflow-x-auto">
        
        <div className="flex items-center gap-3 border-b border-gray-150 dark:border-gray-800 pb-5 mb-6">
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-xl">
            <Clock className="h-3.5 w-3.5 text-red-500 animate-spin" />
            TTL Countdown
          </span>
          <p className="text-xs text-gray-400">30-day retention policies auto-purge items.</p>
        </div>

        {trashedInvoices.length > 0 ? (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-150 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-4">Invoice #</th>
                <th className="py-4 px-4">Client</th>
                <th className="py-4 px-4">Deleted At</th>
                <th className="py-4 px-4 text-center">Remaining Days</th>
                <th className="py-4 px-4 text-right">Amount</th>
                <th className="py-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {trashedInvoices.map((inv) => {
                const daysLeft = calculateDaysLeft(inv.deletedAt);
                const isItemLoading = actionLoading === `${inv._id}-restore` || actionLoading === `${inv._id}-permanent`;

                return (
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
                      {new Date(inv.deletedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        daysLeft <= 5 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {daysLeft} days remaining
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        
                        <button
                          onClick={() => handleRestore(inv._id)}
                          disabled={isItemLoading}
                          className="rounded-lg border border-gray-200 dark:border-gray-800 p-2 text-green-500 hover:bg-green-500/10 hover:text-green-600 disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5"
                          title="Restore"
                        >
                          {isItemLoading && actionLoading === `${inv._id}-restore` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => handlePermanentDelete(inv._id)}
                          disabled={isItemLoading}
                          className="rounded-lg border border-gray-200 dark:border-gray-800 p-2 text-red-400 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5"
                          title="Permanent Delete"
                        >
                          {isItemLoading && actionLoading === `${inv._id}-permanent` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash className="h-3.5 w-3.5" />
                          )}
                          <span>Purge</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Trash2 className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <h4 className="text-base font-bold text-gray-900 dark:text-white mt-3">Trash Bin is Empty</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Any invoice you delete will stay here for 30 days before being permanently removed from the system.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
