'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus, Save, Loader2, ArrowLeft,
  PenTool, Type, Upload, RotateCcw, X, Sparkles,
  CheckCircle, Trash, Mail, MessageCircle, ChevronDown, LayoutTemplate,
  Maximize2, Minimize2
} from 'lucide-react';
import { client } from '@/lib/api/client';
import { useAuth } from '@/auth/AuthProvider';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

type TemplateId = 'standard' | 'retail' | 'restaurant' | 'rental' | 'construction' | 'professional' | 'creative' | 'startup' | 'elegant';

interface InvoiceFormData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  taxPercentage: number;
  discountType: 'percentage' | 'flat' | 'none';
  discountValue: number;
  notes: string;
  paymentInstructions: string;
  termsAndConditions: string;
  customFields: Record<string, string>;
  templateType: TemplateId;
  signatureType: 'draw' | 'type' | 'upload' | 'none';
  signatureTypedName: string;
  signatureTypedFont: 'Dancing Script' | 'Caveat';
  signatureUrl: string;
}

const TEMPLATES: { id: TemplateId; name: string; emoji: string; desc: string; color: string }[] = [
  { id: 'standard', name: 'Standard Business', emoji: '💼', desc: 'Clean corporate layout for freelancers & agencies.', color: '#6366f1' },
  { id: 'retail', name: 'Retail & Shop', emoji: '🛒', desc: 'Emphasizes product quantities, SKU, and tax breakdown.', color: '#0ea5e9' },
  { id: 'restaurant', name: 'Restaurant & Food', emoji: '🍽️', desc: 'Itemized food sections for cafes & catering.', color: '#f97316' },
  { id: 'rental', name: 'Rental Property', emoji: '🏠', desc: 'Property name, tenant info, unit, and rent period.', color: '#10b981' },
  { id: 'construction', name: 'Construction', emoji: '🏗️', desc: 'Project milestones, PO, and labor/material breakdown.', color: '#f59e0b' },
  { id: 'professional', name: 'Professional Services', emoji: '⚖️', desc: 'Hourly billing for lawyers, consultants & doctors.', color: '#3b82f6' },
  { id: 'creative', name: 'Creative Studio', emoji: '🎨', desc: 'A bold, design-forward template with vibrant accents.', color: '#ec4899' },
  { id: 'startup', name: 'Tech Startup', emoji: '🚀', desc: 'Sleek, high-contrast minimal design with monospaced numbers.', color: '#14b8a6' },
  { id: 'elegant', name: 'Elegant Classic', emoji: '✨', desc: 'Highly professional serif design with subtle dividers.', color: '#111827' },
];

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
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

// ─── Template Gallery Modal ───────────────────────────────────────────────────

function TemplateGallery({ open, current, onSelect, onClose }: {
  open: boolean;
  current: TemplateId;
  onSelect: (id: TemplateId) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] px-8 py-6 z-10">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Template Gallery</h2>
              <p className="text-sm text-gray-500 mt-1">Pick a design optimized for your industry.</p>
            </div>
            <button onClick={onClose} className="rounded-xl border border-gray-200 dark:border-gray-700 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => { onSelect(tpl.id); onClose(); }}
                className={`text-left group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                  current === tpl.id
                    ? 'border-[var(--brand-color)] shadow-[0_0_0_4px_var(--brand-color)]/10'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                <div
                  className="h-36 flex items-center justify-center text-5xl"
                  style={{ background: `${tpl.color}10` }}
                >
                  {tpl.emoji}
                </div>
                <div className="p-4 bg-white dark:bg-[#0a0a0a]">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{tpl.name}</h3>
                    {current === tpl.id && <CheckCircle className="h-4 w-4 text-[var(--brand-color)]" />}
                  </div>
                  <p className="text-xs text-gray-500">{tpl.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Signature Panel ──────────────────────────────────────────────────────────

function SignaturePanel({ open, onClose, formData, setFormData, canvasRef, isDrawing, setIsDrawing }: {
  open: boolean;
  onClose: () => void;
  formData: InvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isDrawing: boolean;
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    if (formData.signatureType === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) { ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
    }
  }, [formData.signatureType, canvasRef]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { x, y } = getPos(e, canvas);
    if ('touches' in e) e.preventDefault();
    ctx.lineTo(x, y); ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current; if (!canvas) return;
    setFormData(p => ({ ...p, signatureUrl: canvas.toDataURL('image/png') }));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setFormData(p => ({ ...p, signatureUrl: '' }));
  };

  const tabBtn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
      active ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm border border-gray-200/60 dark:border-gray-700' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white dark:bg-[#0a0a0a] shadow-2xl border-l border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-5">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Signature</h3>
            <p className="text-xs text-gray-400 mt-0.5">Authorize this invoice with your signature</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-gray-200 dark:border-gray-700 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pt-5">
          <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-800">
            <button onClick={() => setFormData(p => ({ ...p, signatureType: 'draw' }))} className={tabBtn(formData.signatureType === 'draw')}><PenTool className="h-3 w-3" /> Draw</button>
            <button onClick={() => setFormData(p => ({ ...p, signatureType: 'type' }))} className={tabBtn(formData.signatureType === 'type')}><Type className="h-3 w-3" /> Type</button>
            <button onClick={() => setFormData(p => ({ ...p, signatureType: 'upload' }))} className={tabBtn(formData.signatureType === 'upload')}><Upload className="h-3 w-3" /> Upload</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {formData.signatureType === 'draw' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Draw your signature below.</p>
              <div className="relative rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 overflow-hidden">
                <canvas ref={canvasRef} width={460} height={160} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full cursor-crosshair touch-none" style={{ height: '140px' }} />
                {!formData.signatureUrl && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><p className="text-xs text-gray-300 dark:text-gray-700 italic">Sign here...</p></div>}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400 italic">Appears on the PDF</p>
                <button onClick={clearCanvas} className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"><RotateCcw className="h-3 w-3" /> Clear</button>
              </div>
            </div>
          )}

          {formData.signatureType === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Your Name</label>
                <input type="text" value={formData.signatureTypedName} onChange={e => setFormData(p => ({ ...p, signatureTypedName: e.target.value }))} className="block w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent py-3 px-4 text-sm text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)]" placeholder="e.g. Alex Johnson" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['Dancing Script', 'Caveat'] as const).map(font => (
                  <button key={font} onClick={() => setFormData(p => ({ ...p, signatureTypedFont: font }))} className={`rounded-xl border py-3 px-4 transition-all ${formData.signatureTypedFont === font ? 'border-[var(--brand-color)] bg-[var(--brand-color)]/5' : 'border-gray-200 dark:border-gray-700'}`}>
                    <span style={{ fontFamily: font, fontSize: '18px', color: formData.signatureTypedFont === font ? 'var(--brand-color)' : '#6b7280' }}>{formData.signatureTypedName || 'Preview'}</span>
                  </button>
                ))}
              </div>
              {formData.signatureTypedName && (
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 p-4">
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-bold">Preview</p>
                  <div className="border-b border-gray-300 dark:border-gray-700 pb-2">
                    <span style={{ fontFamily: formData.signatureTypedFont, fontSize: '28px', color: 'var(--brand-color)' }}>{formData.signatureTypedName}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1.5 uppercase tracking-widest">Authorized Signature</p>
                </div>
              )}
            </div>
          )}

          {formData.signatureType === 'upload' && (
            <div className="space-y-4">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setFormData(p => ({ ...p, signatureUrl: ev.target?.result as string })); r.readAsDataURL(f); }} className="hidden" />
              {formData.signatureUrl ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4 flex items-center justify-center">
                    <img src={formData.signatureUrl} alt="Signature" className="max-h-24 max-w-full object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Upload className="h-3.5 w-3.5" /> Replace</button>
                    <button onClick={() => setFormData(p => ({ ...p, signatureUrl: '' }))} className="flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/40 py-2.5 px-4 text-xs font-bold text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash className="h-3.5 w-3.5" /> Remove</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-10 text-center hover:border-[var(--brand-color)]/50 transition-all">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-color)]/10"><Upload className="h-6 w-6 text-[var(--brand-color)]" /></div>
                  <div><p className="text-sm font-bold text-gray-700 dark:text-gray-300">Click to upload signature</p><p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP — max 5MB</p></div>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-5 flex gap-3">
          <button onClick={() => { setFormData(p => ({ ...p, signatureType: 'none', signatureUrl: '', signatureTypedName: '' })); onClose(); }} className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-700 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Remove Signature</button>
          <button onClick={onClose} className="flex-1 rounded-2xl bg-[var(--brand-color)] py-3 text-sm font-bold text-white hover:brightness-110 transition-all" style={{ boxShadow: '0 4px 12px var(--brand-glow)' }}>Apply Signature</button>
        </div>
      </div>
    </>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

function InvoiceEditorContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [sigPanelOpen, setSigPanelOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [shareDropdown, setShareDropdown] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isUpdatingPreview, setIsUpdatingPreview] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    taxPercentage: user?.defaultTaxPercentage || 0,
    discountType: 'none',
    discountValue: 0,
    notes: 'Thank you for your business!',
    paymentInstructions: (user as any)?.defaultPaymentInstructions || '',
    termsAndConditions: (user as any)?.defaultTermsAndConditions || '',
    customFields: {},
    templateType: ((user as any)?.defaultTemplate as TemplateId) || 'standard',
    signatureType: 'none',
    signatureTypedName: '',
    signatureTypedFont: 'Dancing Script',
    signatureUrl: '',
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (invoiceId) fetchInvoiceForEdit(invoiceId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const fetchInvoiceForEdit = async (id: string) => {
    setLoading(true);
    try {
      const { data } = await client.get(`/api/v1/invoices/${id}`);
      const inv = data.data;
      setFormData({
        invoiceNumber: inv.invoiceNumber || '',
        clientName: inv.toName || '',
        clientEmail: inv.toEmail || '',
        clientAddress: inv.toAddress || '',
        issueDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '',
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lineItems: (inv.lineItems || []).map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice / 100,
        })),
        taxPercentage: inv.taxPercentage || 0,
        discountType: inv.discountType || 'none',
        discountValue: inv.discountType === 'flat' ? inv.discountValue / 100 : inv.discountValue || 0,
        notes: inv.notes || '',
        paymentInstructions: inv.paymentInstructions || '',
        termsAndConditions: inv.termsAndConditions || '',
        customFields: inv.customFields || {},
        templateType: inv.templateId || 'standard',
        signatureType: inv.signatureType === 'font' ? 'type' : inv.signatureType === 'draw' ? 'draw' : 'none',
        signatureTypedName: inv.signatureName || '',
        signatureTypedFont: 'Dancing Script',
        signatureUrl: inv.signatureImageBase64 || '',
      });
    } catch {
      showToast('Failed to load invoice data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Debounced live preview — stable dependency using JSON serialization
  // Using a primitive string prevents infinite re-triggers from object reference changes.
  const formDataJson = JSON.stringify(formData);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPreview = async () => {
      setIsUpdatingPreview(true);
      try {
        const payload = buildPayload(true);
        const res = await client.post('/api/v1/invoices/preview', payload, {
          signal: controller.signal,
        });
        setPreviewHtml(res.data);
      } catch (err: any) {
        if (err?.name !== 'CanceledError') {
          // fail silently for real errors
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsUpdatingPreview(false);
        }
      }
    };
    const t = setTimeout(fetchPreview, 800);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formDataJson]);

  const calcTotals = () => {
    const subtotal = formData.lineItems.reduce((acc, i) => acc + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
    const taxAmount = subtotal * (Number(formData.taxPercentage || 0) / 100);
    let discountAmount = 0;
    if (formData.discountType === 'flat') discountAmount = Number(formData.discountValue || 0);
    else if (formData.discountType === 'percentage') discountAmount = subtotal * (Number(formData.discountValue || 0) / 100);
    return { subtotal, taxAmount, discountAmount, total: Math.max(0, subtotal + taxAmount - discountAmount) };
  };
  const totals = calcTotals();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.defaultCurrency || 'USD' }).format(amount);

  const buildPayload = (forPreview = false) => ({
    fromName: user?.businessName || user?.name || 'My Company',
    fromAddress: user?.businessAddress || '',
    fromEmail: user?.email || '',
    toName: forPreview ? (formData.clientName || 'Client Name') : formData.clientName,
    toEmail: formData.clientEmail,
    toAddress: formData.clientAddress,
    invoiceDate: formData.issueDate,
    dueDate: formData.dueDate || undefined,
    lineItems: formData.lineItems.map(item => ({
      description: item.description || (forPreview ? 'Service description' : item.description),
      quantity: Number(item.quantity) || 1,
      unitPrice: Math.round(Number(item.unitPrice) * 100),
    })),
    taxPercentage: Number(formData.taxPercentage || 0),
    discountType: formData.discountType === 'none' ? undefined : formData.discountType,
    discountValue: formData.discountType === 'none' ? undefined : Number(formData.discountValue || 0),
    notes: formData.notes,
    paymentInstructions: formData.paymentInstructions,
    termsAndConditions: formData.termsAndConditions,
    customFields: formData.customFields,
    templateId: formData.templateType,
    signatureType: formData.signatureType === 'type' ? 'font' : formData.signatureType === 'none' ? 'none' : formData.signatureType,
    signatureName: formData.signatureType === 'type' ? formData.signatureTypedName : undefined,
    signatureImageBase64: (formData.signatureType === 'draw' || formData.signatureType === 'upload') ? formData.signatureUrl : undefined,
    currency: user?.defaultCurrency || 'USD',
  });

  const handleSave = async () => {
    if (!formData.clientName.trim()) { showToast('Client name is required.', 'error'); return; }
    if (formData.lineItems.some(i => !i.description.trim())) { showToast('All line items need a description.', 'error'); return; }
    setSaveLoading(true);
    try {
      // Auto-persist terms and conditions / payment instructions if changed
      const defaultTerms = (user as any)?.defaultTermsAndConditions || '';
      const defaultPayment = (user as any)?.defaultPaymentInstructions || '';
      
      if (formData.termsAndConditions !== defaultTerms || formData.paymentInstructions !== defaultPayment) {
        try {
          await client.patch('/api/v1/users/profile', {
            defaultTermsAndConditions: formData.termsAndConditions,
            defaultPaymentInstructions: formData.paymentInstructions
          });
        } catch (profileErr) {
          console.error('Failed to auto-persist terms to profile:', profileErr);
        }
      }

      const payload = buildPayload(false);
      if (invoiceId) {
        await client.patch(`/api/v1/invoices/${invoiceId}`, payload);
        showToast('Invoice updated!', 'success');
      } else {
        await client.post('/api/v1/invoices', payload);
        showToast('Invoice created!', 'success');
      }
      setTimeout(() => router.push('/invoices'), 1200);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      showToast(error.response?.data?.error?.message || 'Failed to save. Check all fields.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const hasSignature = formData.signatureType !== 'none' && (formData.signatureUrl || formData.signatureTypedName);

  const handleGmailShare = () => {
    const sub = encodeURIComponent(`Invoice ${formData.invoiceNumber || '(Draft)'} from ${user?.businessName || user?.name}`);
    const body = encodeURIComponent(`Hi ${formData.clientName || 'there'},\n\nInvoice: ${formData.invoiceNumber || 'Draft'}\nAmount Due: ${formatCurrency(totals.total)}\nDue Date: ${formData.dueDate || 'N/A'}\n\nThank you!\n\n— ${user?.name}`);
    window.open(`mailto:${formData.clientEmail}?subject=${sub}&body=${body}`);
    setShareDropdown(false);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Hi ${formData.clientName || 'there'}, here is your invoice:\n\n📄 *${formData.invoiceNumber || 'Draft'}*\n💰 Amount: *${formatCurrency(totals.total)}*\n📅 Due: ${formData.dueDate || 'N/A'}\n\nThank you! 🙏\n— ${user?.name}`);
    window.open(`https://wa.me/?text=${text}`);
    setShareDropdown(false);
  };

  const inputCls = "block w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent py-2.5 px-3.5 text-sm text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/15 transition-all";
  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5";
  const textareaCls = "block w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-transparent py-3 px-4 text-sm text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--brand-color)]/15 resize-none transition-all";
  const customFieldInput = "block w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-2.5 px-3.5 text-sm outline-none focus:border-[var(--brand-color)]";

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-color)]" />
    </div>
  );

  const currentTemplate = TEMPLATES.find(t => t.id === formData.templateType);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <TemplateGallery open={galleryOpen} current={formData.templateType} onSelect={id => setFormData(p => ({ ...p, templateType: id }))} onClose={() => setGalleryOpen(false)} />
      <SignaturePanel open={sigPanelOpen} onClose={() => setSigPanelOpen(false)} formData={formData} setFormData={setFormData} canvasRef={canvasRef} isDrawing={isDrawing} setIsDrawing={setIsDrawing} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-gray-800 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-xl border border-gray-200 dark:border-gray-800 p-2.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-gray-900 dark:text-white">{invoiceId ? 'Edit Invoice' : 'New Invoice'}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Create and send professional invoices.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShareDropdown(!shareDropdown)} className="flex items-center gap-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {shareDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShareDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 z-20 w-44 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] p-1.5 shadow-2xl">
                  <button onClick={handleGmailShare} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Mail className="h-4 w-4 text-red-500" /><span>Gmail</span></button>
                  <button onClick={handleWhatsAppShare} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><MessageCircle className="h-4 w-4 text-green-500" /><span>WhatsApp</span></button>
                </div>
              </>
            )}
          </div>
          <button onClick={handleSave} disabled={saveLoading} className="flex items-center gap-2 rounded-2xl bg-[var(--brand-color)] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-150 hover:brightness-110 border-b-4 border-black/20 active:border-b-0 active:translate-y-1 disabled:pointer-events-none disabled:opacity-50" style={{ boxShadow: '0 4px 16px var(--brand-glow)' }}>
            {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{invoiceId ? 'Save Changes' : 'Save Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* LEFT: Form */}
        <div className="space-y-6 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm max-h-[85vh] overflow-y-auto">

          {/* Template Selector */}
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: currentTemplate ? `${currentTemplate.color}15` : '#6366f110', border: `1px solid ${currentTemplate?.color || '#6366f1'}25` }}>
                  {currentTemplate?.emoji || '📄'}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Template</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{currentTemplate?.name || formData.templateType}</p>
                </div>
              </div>
              <button onClick={() => setGalleryOpen(true)} className="flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-bold shadow-sm hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] transition-colors">
                <LayoutTemplate className="h-4 w-4" /> Change
              </button>
            </div>
          </div>

          {/* Template-Specific Custom Fields */}
          {(['retail', 'restaurant', 'rental', 'construction', 'professional'] as TemplateId[]).includes(formData.templateType) && (
            <div className="rounded-2xl border border-[var(--brand-color)]/20 bg-[var(--brand-color)]/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--brand-color)]" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--brand-color)]">Template Fields</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {formData.templateType === 'retail' && (
                  <>
                    <div><label className={labelCls}>Store ID</label><input type="text" value={formData.customFields.storeId || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, storeId: e.target.value } }))} className={customFieldInput} placeholder="STR-001" /></div>
                    <div><label className={labelCls}>Cashier</label><input type="text" value={formData.customFields.cashier || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, cashier: e.target.value } }))} className={customFieldInput} placeholder="John Doe" /></div>
                  </>
                )}
                {formData.templateType === 'restaurant' && (
                  <>
                    <div><label className={labelCls}>Table Number</label><input type="text" value={formData.customFields.tableNumber || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, tableNumber: e.target.value } }))} className={customFieldInput} placeholder="Table 12" /></div>
                    <div><label className={labelCls}>Order Type</label><input type="text" value={formData.customFields.orderType || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, orderType: e.target.value } }))} className={customFieldInput} placeholder="Dine-In / Takeaway" /></div>
                  </>
                )}
                {formData.templateType === 'rental' && (
                  <>
                    <div><label className={labelCls}>Property Name</label><input type="text" value={formData.customFields.propertyName || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, propertyName: e.target.value } }))} className={customFieldInput} placeholder="Sunset Apartments" /></div>
                    <div><label className={labelCls}>Unit Number</label><input type="text" value={formData.customFields.unitNumber || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, unitNumber: e.target.value } }))} className={customFieldInput} placeholder="4B" /></div>
                    <div className="sm:col-span-2"><label className={labelCls}>Rent Period</label><input type="text" value={formData.customFields.rentPeriod || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, rentPeriod: e.target.value } }))} className={customFieldInput} placeholder="Jan 1 – Jan 31, 2025" /></div>
                  </>
                )}
                {formData.templateType === 'construction' && (
                  <>
                    <div><label className={labelCls}>Project Name</label><input type="text" value={formData.customFields.projectName || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, projectName: e.target.value } }))} className={customFieldInput} placeholder="Downtown Plaza Renovation" /></div>
                    <div><label className={labelCls}>Milestone</label><input type="text" value={formData.customFields.milestone || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, milestone: e.target.value } }))} className={customFieldInput} placeholder="Phase 1 Completion" /></div>
                    <div className="sm:col-span-2"><label className={labelCls}>PO / Project Ref</label><input type="text" value={formData.customFields.projectRef || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, projectRef: e.target.value } }))} className={customFieldInput} placeholder="PO-987654321" /></div>
                  </>
                )}
                {formData.templateType === 'professional' && (
                  <>
                    <div><label className={labelCls}>Services For</label><input type="text" value={formData.customFields.servicesFor || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, servicesFor: e.target.value } }))} className={customFieldInput} placeholder="Q1 Audit" /></div>
                    <div><label className={labelCls}>Engagement Type</label><input type="text" value={formData.customFields.engagementType || ''} onChange={e => setFormData(p => ({ ...p, customFields: { ...p.customFields, engagementType: e.target.value } }))} className={customFieldInput} placeholder="Hourly Consulting" /></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Client Details */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">Client Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: 'Client Name *', name: 'clientName', placeholder: 'ACME Corp', type: 'text' },
                { label: 'Client Email', name: 'clientEmail', placeholder: 'client@domain.com', type: 'email' },
                { label: 'Invoice Number', name: 'invoiceNumber', placeholder: 'INV-0001 (auto)', type: 'text' },
                { label: 'Client Address', name: 'clientAddress', placeholder: '123 Main St', type: 'text' },
                { label: 'Issue Date', name: 'issueDate', placeholder: '', type: 'date' },
                { label: 'Due Date', name: 'dueDate', placeholder: '', type: 'date' },
              ].map(({ label, name, placeholder, type }) => (
                <div key={name}>
                  <label className={labelCls}>{label}</label>
                  <input type={type} name={name} value={formData[name as keyof InvoiceFormData] as string} onChange={e => setFormData(p => ({ ...p, [name]: e.target.value }))} className={inputCls} placeholder={placeholder} />
                </div>
              ))}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Line Items</h3>
              <button onClick={() => setFormData(p => ({ ...p, lineItems: [...p.lineItems, { description: '', quantity: 1, unitPrice: 0 }] }))} className="flex items-center gap-1 rounded-xl bg-[var(--brand-color)]/8 px-3 py-1.5 text-xs font-bold text-[var(--brand-color)] hover:bg-[var(--brand-color)]/15 transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
            {formData.lineItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  {index === 0 && <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Description</label>}
                  <input type="text" value={item.description} onChange={e => { const items = [...formData.lineItems]; items[index] = { ...items[index], description: e.target.value }; setFormData(p => ({ ...p, lineItems: items })); }} className="block w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent py-2.5 px-3 text-xs text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)] transition-all" placeholder="Service description" />
                </div>
                <div className="w-14">
                  {index === 0 && <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Qty</label>}
                  <input type="number" value={item.quantity} onChange={e => { const items = [...formData.lineItems]; items[index] = { ...items[index], quantity: Number(e.target.value) }; setFormData(p => ({ ...p, lineItems: items })); }} className="block w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent py-2.5 px-2 text-xs text-center text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)] transition-all" />
                </div>
                <div className="w-24">
                  {index === 0 && <label className="block text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">Price</label>}
                  <input type="number" value={item.unitPrice} onChange={e => { const items = [...formData.lineItems]; items[index] = { ...items[index], unitPrice: Number(e.target.value) }; setFormData(p => ({ ...p, lineItems: items })); }} className="block w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent py-2.5 px-2.5 text-xs text-right text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)] transition-all" placeholder="0.00" />
                </div>
                <button onClick={() => { if (formData.lineItems.length === 1) return; setFormData(p => ({ ...p, lineItems: p.lineItems.filter((_, i) => i !== index) })); }} disabled={formData.lineItems.length === 1} className="rounded-xl border border-gray-200 dark:border-gray-800 p-2.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 disabled:opacity-30 transition-colors">
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Tax & Discount */}
          <div className="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
            <div>
              <label className={labelCls}>Tax %</label>
              <input type="number" value={formData.taxPercentage} onChange={e => setFormData(p => ({ ...p, taxPercentage: Number(e.target.value) }))} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Discount</label>
              <select value={formData.discountType} onChange={e => setFormData(p => ({ ...p, discountType: e.target.value as 'percentage' | 'flat' | 'none' }))} className={inputCls}>
                <option value="none">None</option>
                <option value="percentage">% Off</option>
                <option value="flat">Flat Amount</option>
              </select>
            </div>
            {formData.discountType !== 'none' && (
              <div>
                <label className={labelCls}>Value</label>
                <input type="number" value={formData.discountValue} onChange={e => setFormData(p => ({ ...p, discountValue: Number(e.target.value) }))} className={inputCls} placeholder="0" />
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
            {formData.taxPercentage > 0 && <div className="flex justify-between text-sm text-gray-500"><span>Tax ({formData.taxPercentage}%)</span><span>{formatCurrency(totals.taxAmount)}</span></div>}
            {formData.discountType !== 'none' && <div className="flex justify-between text-sm text-red-500"><span>Discount</span><span>−{formatCurrency(totals.discountAmount)}</span></div>}
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 text-base font-black text-gray-900 dark:text-white">
              <span>Total Due</span><span style={{ color: 'var(--brand-color)' }}>{formatCurrency(totals.total)}</span>
            </div>
          </div>

          {/* Signature */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Signature</h3>
              {hasSignature && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full"><CheckCircle className="h-3 w-3" /> Added</span>}
            </div>
            <button onClick={() => setSigPanelOpen(true)} className={`w-full flex items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed py-5 text-sm font-bold transition-all duration-200 ${hasSignature ? 'border-[var(--brand-color)]/40 bg-[var(--brand-color)]/5 text-[var(--brand-color)]' : 'border-gray-200 dark:border-gray-800 text-gray-400 hover:border-[var(--brand-color)]/40 hover:text-[var(--brand-color)]'}`}>
              <PenTool className="h-4 w-4" /><span>{hasSignature ? 'Edit Signature' : 'Add Signature'}</span>
            </button>
            {hasSignature && (
              <div className="mt-3 flex items-center justify-center rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 py-3 px-4">
                {(formData.signatureType === 'draw' || formData.signatureType === 'upload') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.signatureUrl} alt="Signature" className="max-h-10 max-w-[180px] object-contain" />
                ) : (
                  <span style={{ fontFamily: formData.signatureTypedFont, fontSize: '22px', color: 'var(--brand-color)' }}>{formData.signatureTypedName}</span>
                )}
              </div>
            )}
          </div>

          {/* Notes, Payment, Terms */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} className={textareaCls} placeholder="A thank-you note or extra details." />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Payment Instructions</label>
              <textarea value={formData.paymentInstructions} onChange={e => setFormData(p => ({ ...p, paymentInstructions: e.target.value }))} rows={2} className={textareaCls} placeholder="Bank details, payment links, etc." />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Terms & Conditions</label>
              <textarea value={formData.termsAndConditions} onChange={e => setFormData(p => ({ ...p, termsAndConditions: e.target.value }))} rows={2} className={textareaCls} placeholder="Late fees, return policies, etc." />
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        {isPreviewFullscreen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsPreviewFullscreen(false)} />}
        <div className={`rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-gray-100 dark:bg-[#1a2234] shadow-2xl flex flex-col overflow-hidden relative ${
          isPreviewFullscreen 
            ? 'fixed inset-4 sm:inset-10 z-50 max-h-none' 
            : 'max-h-[85vh]'
        }`}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700/50 shrink-0 bg-gray-100 dark:bg-[#1a2234] z-10">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <div className="h-3 w-3 rounded-full bg-green-400/70" />
            </div>
            <span className="text-xs font-medium text-gray-500">Live Preview</span>
            <div className="flex items-center gap-3">
              {isUpdatingPreview && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="hidden sm:inline">Updating...</span>
                </div>
              )}
              <button 
                onClick={() => setIsPreviewFullscreen(!isPreviewFullscreen)} 
                className="rounded p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title={isPreviewFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
              >
                {isPreviewFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className={`flex-1 overflow-auto p-4 flex items-start justify-center ${isPreviewFullscreen ? 'bg-gray-200/50 dark:bg-black/20' : ''}`}>
            {previewHtml ? (
              <div 
                className="w-full shadow-2xl origin-top transition-transform duration-300" 
                style={{ 
                  transform: isPreviewFullscreen ? 'scale(1)' : 'scale(0.75)', 
                  transformOrigin: 'top center', 
                  marginBottom: isPreviewFullscreen ? '0' : '-25%',
                  maxWidth: '794px'
                }}
              >
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[1123px] max-w-[794px] border-none bg-white"
                  title="Invoice Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                <Loader2 className="h-8 w-8 animate-spin opacity-30" />
                <p className="text-sm">Loading preview...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-color)]" />
      </div>
    }>
      <InvoiceEditorContent />
    </Suspense>
  );
}
