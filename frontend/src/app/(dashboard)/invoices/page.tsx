'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Download,
  Loader2,
  CheckSquare,
  Square,
  Edit2,
  Mail,
  MessageCircle,
  Share2,
  CheckCircle,
  X,
  ChevronDown
} from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuth } from '@/auth/AuthProvider';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-[var(--brand-color)]/30 bg-[var(--brand-color)]/10 text-[var(--brand-color)]',
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-md text-sm font-semibold ${colors[type]}`}>
      {type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
      {type === 'error' && <X className="h-4 w-4 shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
    </div>
  );
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
}

export default function InvoicesHub() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<'invoiceNumber' | 'total' | 'issueDate'>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [shareDropdownId, setShareDropdownId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => { viewMode === 'active' ? fetchInvoices() : fetchTrash(); }, [viewMode]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/api/v1/invoices');
      const invoicesArray = data.data || [];
      const mappedInvoices = invoicesArray.map((inv: any) => ({
        ...inv,
        clientName: inv.clientName || inv.toName || '',
        issueDate: inv.issueDate || inv.invoiceDate || '',
        dueDate: inv.dueDate || ''
      }));
      setInvoices(mappedInvoices);
    } catch (err) {
      console.error('Failed to fetch invoices list:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/api/v1/invoices/trash');
      const trashArray = data.data || [];
      const mappedTrash = trashArray.map((inv: any) => ({
        ...inv,
        clientName: inv.clientName || inv.toName || '',
        issueDate: inv.issueDate || inv.invoiceDate || '',
        dueDate: inv.dueDate || ''
      }));
      setInvoices(mappedTrash);
    } catch (err) {
      console.error('Failed to fetch trash invoices:', err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Move this invoice to Trash?')) return;
    setActionLoading(id);
    try {
      await client.delete(`/api/v1/invoices/${id}`);
      showToast('Invoice moved to Trash.', 'info');
      viewMode === 'active' ? fetchInvoices() : fetchTrash();
    } catch {
      showToast('Failed to delete invoice.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected invoices?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map((id) => client.delete(`/api/v1/invoices/${id}`)));
      showToast(`${selectedIds.length} invoices moved to Trash.`, 'info');
      viewMode === 'active' ? fetchInvoices() : fetchTrash();
      setSelectedIds([]);
    } catch {
      showToast('Some deletions failed. Please retry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cycleStatus = (currentStatus: string) => {
    const sequence = ['draft', 'sent', 'paid', 'overdue'];
    const currentIndex = sequence.indexOf(currentStatus);
    return sequence[(currentIndex + 1) % sequence.length];
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    setActionLoading(`${id}-status`);
    try {
      const { data } = await client.patch(`/api/v1/invoices/${id}/status`, { status: nextStatus });
      setInvoices(prev => prev.map(inv => inv._id === id ? { ...inv, status: data.data.status } : inv));
      showToast(`Status updated to ${nextStatus}.`, 'success');
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredInvoices.map((inv) => inv._id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleDownload = async (inv: Invoice) => {
    setActionLoading(`${inv._id}-download`);
    try {
      const response = await client.get(`/api/v1/invoices/${inv._id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Invoice_${inv.invoiceNumber}.pdf`;
      link.click();
      showToast('Invoice downloaded!', 'success');
    } catch {
      showToast('Failed to download PDF.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGmailShare = (inv: Invoice) => {
    const subject = encodeURIComponent(`Invoice ${inv.invoiceNumber}`);
    const body = encodeURIComponent(
      `Hi ${inv.clientName},\n\nPlease find your invoice details below:\n\nInvoice: ${inv.invoiceNumber}\nAmount: ${formatCurrency(inv.total)}\nDue: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}\n\nThank you!\n\n— ${user?.name}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShareDropdownId(null);
  };

  const handleWhatsAppShare = (inv: Invoice) => {
    const text = encodeURIComponent(
      `Hi ${inv.clientName} 👋\n\n📄 Invoice: *${inv.invoiceNumber}*\n💰 Amount: *${formatCurrency(inv.total)}*\n📅 Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}\n\nPlease let me know if you have any questions. Thank you! 🙏`
    );
    window.open(`https://wa.me/?text=${text}`);
    setShareDropdownId(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.defaultCurrency || 'USD'
    }).format(amount / 100);
  };

  // Sorting + Filtering Logic
  const filteredInvoices = invoices
    .filter((inv) => {
      const matchesSearch = 
        inv.clientName.toLowerCase().includes(search.toLowerCase()) || 
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'invoiceNumber') {
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
      } else if (sortField === 'total') {
        comparison = a.total - b.total;
      } else if (sortField === 'issueDate') {
        comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

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

  if (loading && invoices.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-color)]" />
      </div>
    );
  }

  // Show empty state when no invoices in current view
  if (!loading && invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16">
        <FileText className="h-10 w-10 text-gray-300 dark:text-gray-700" />
        <h4 className="text-base font-bold text-gray-900 dark:text-white mt-3">
          {viewMode === 'active' ? 'No invoices found' : 'Trash is empty'}
        </h4>
        <p className="text-xs text-gray-400 mt-1 max-w-sm">
          {viewMode === 'active' ? 'Create a new invoice to get started.' : 'No deleted invoices are currently in the Trash Bin.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      {shareDropdownId && <div className="fixed inset-0 z-10" onClick={() => setShareDropdownId(null)} />}

      {/* Top Banner section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Invoice Manager
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/invoices/new"
            className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-color)] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-150 hover:brightness-110 border-b-4 border-black/20 active:border-b-0 active:translate-y-1"
            style={{ boxShadow: '0 4px 16px var(--brand-glow)' }}
          >
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </Link>
          <button
            onClick={() => setViewMode(viewMode === 'active' ? 'trash' : 'active')}
            className="flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-900/50 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {viewMode === 'active' ? 'View Trash' : 'Back to Invoices'}
          </button>
        </div>
      </div>

      {/* Searching, Filtering, Sorting and Bulk Operations Header Card */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-5 shadow-sm space-y-4">
        
        {/* Row 1: Search and Status Filtering Tabs */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/20"
              placeholder="Search by client or invoice number..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-2xl border border-gray-150 dark:border-gray-800 shrink-0">
            {['all', 'draft', 'sent', 'paid', 'overdue'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  filterStatus === status 
                    ? 'bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white shadow-sm border border-gray-200/50 dark:border-gray-800' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Bulk Actions and Sort Preferences */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/15 border border-red-500/20 px-4 py-2.5 text-xs font-bold transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent py-2 pl-3 pr-8 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="issueDate" className="dark:bg-gray-950">Issue Date</option>
              <option value="total" className="dark:bg-gray-950">Amount</option>
              <option value="invoiceNumber" className="dark:bg-gray-950">Serial Number</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
        </div>

      </div>

      {/* Grid of Results */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm overflow-x-auto">
        {filteredInvoices.length > 0 ? (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-150 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-400">
                <th className="py-4 px-4 w-12 text-center">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-gray-950 dark:hover:text-white"
                  >
                    {filteredInvoices.every(inv => selectedIds.includes(inv._id)) ? (
                      <CheckSquare className="h-5 w-5 text-[var(--brand-color)]" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-4">Invoice #</th>
                <th className="py-4 px-4">Client</th>
                <th className="py-4 px-4">Issue Date</th>
                <th className="py-4 px-4">Due Date</th>
                <th className="py-4 px-4 text-right">Total Amount</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-4 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedIds.includes(inv._id);
                const isItemLoading = actionLoading === inv._id || actionLoading === `${inv._id}-status` || actionLoading === `${inv._id}-download`;
                
                return (
                  <tr 
                    key={inv._id}
                    className={`group transition-all duration-150 ${
                      isSelected 
                        ? 'bg-[var(--brand-color)]/[0.02] hover:bg-[var(--brand-color)]/[0.04]' 
                        : 'hover:bg-gray-50/50 dark:hover:bg-gray-900/20'
                    }`}
                  >
                    <td className="py-4 px-4 text-center">
                      <button 
                        onClick={() => toggleSelect(inv._id)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-950 dark:hover:text-white transition-colors duration-150"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-[var(--brand-color)]" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
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
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {isItemLoading && actionLoading === `${inv._id}-status` ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-color)] mx-auto" />
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(inv._id, cycleStatus(inv.status))}
                          className="flex items-center gap-1.5 mx-auto focus:outline-none hover:scale-105 active:scale-95 transition-transform duration-200"
                          title="Click to change status"
                        >
                          {getStatusBadge(inv.status)}
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        
                        <Link
                          href={`/invoices/new?id=${inv._id}`}
                          className="rounded-lg border border-gray-200 dark:border-gray-800 p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => handleDownload(inv)}
                          disabled={isItemLoading}
                          className="rounded-lg border border-gray-200 dark:border-gray-800 p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                          title="Download PDF"
                        >
                          {isItemLoading && actionLoading === `${inv._id}-download` ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-color)]" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>

                        {/* Share dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShareDropdownId(shareDropdownId === inv._id ? null : inv._id); }}
                            className="rounded-lg border border-gray-200 dark:border-gray-800 p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-[var(--brand-color)] transition-colors"
                            title="Share Invoice"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          {shareDropdownId === inv._id && (
                            <div className="absolute right-0 top-full mt-1.5 z-30 w-40 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] p-1 shadow-2xl">
                              <button
                                onClick={() => handleGmailShare(inv)}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <Mail className="h-3.5 w-3.5 text-red-500" /> Gmail
                              </button>
                              <button
                                onClick={() => handleWhatsAppShare(inv)}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <MessageCircle className="h-3.5 w-3.5 text-green-500" /> WhatsApp
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleDelete(inv._id)}
                          disabled={isItemLoading}
                          className="rounded-lg border border-gray-200 dark:border-gray-800 p-2 text-red-400 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 transition-colors"
                          title="Delete"
                        >
                          {isItemLoading && actionLoading === inv._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
            <FileText className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <h4 className="text-base font-bold text-gray-900 dark:text-white mt-3">No matching invoices found</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              We couldn&apos;t find any records matching your search queries or filter selections. Try updating your params.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
