'use client';

import React, { useState } from 'react';
import { 
  User, 
  Building, 
  MapPin, 
  DollarSign, 
  Percent, 
  FolderKey, 
  Save, 
  Loader2, 
  Sparkles,
  Download,
  AlertTriangle,
  Trash
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/auth/ThemeContext';
import { client } from '@/lib/api/client';

export default function SettingsPage() {
  const { user, updateUserSession } = useAuth();
  const { brandColor, updateBrandColor } = useTheme();

  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Account Deletion
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    businessAddress: user?.businessAddress || '',
    invoicePrefix: user?.invoicePrefix || 'INV',
    defaultCurrency: user?.defaultCurrency || 'USD',
    defaultTaxPercentage: user?.defaultTaxPercentage || 0
  });

  const presetColors = [
    { name: 'Invoicon Blue', hex: '#01019d' },
    { name: 'Teal Elegance', hex: '#0d9488' },
    { name: 'Royal Violet', hex: '#7c3aed' },
    { name: 'Coral Pulse', hex: '#ea580c' },
    { name: 'Emerald Capital', hex: '#16a34a' },
    { name: 'Carbon Sleek', hex: '#374151' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'defaultTaxPercentage' ? Number(value) : value 
    }));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await client.patch('/api/v1/users/me', formData);
      updateUserSession(data.data);
      alert('Workspace preferences saved successfully!');
    } catch (err) {
      alert('Failed to save profile preferences.');
    } finally {
      setLoading(false);
    }
  };

  const handleGDPRDataExport = async () => {
    setExportLoading(true);
    try {
      const { data } = await client.get('/api/v1/users/me/export');
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Invoicon_Workspace_GDPR_Export.json`;
      link.click();
    } catch (err) {
      alert('Export failed.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'DELETE MY ACCOUNT') {
      alert('Please confirm the text exactly.');
      return;
    }
    setDeleteLoading(true);
    try {
      await client.delete('/api/v1/users/me', {
        data: { confirmText: confirmDeleteText }
      });
      alert('Your account and matching data have been purged successfully.');
      window.location.href = '/login';
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Purge failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Workspace Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Personalize brand customizers, edit metadata headers, and manage billing coordinates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Dynamic Brand customization Panel */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm space-y-6 lg:col-span-1">
          <div className="border-b border-gray-150 dark:border-gray-800 pb-4">
            <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--brand-color)]" />
              Dynamic Theme
            </h3>
            <p className="text-xs text-gray-400 mt-1">Changes propagate instantly to sidebars, buttons, and invoice templates.</p>
          </div>

          {/* Color Picker Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Live Brand Color</label>
              <div className="flex gap-3 items-center mt-2.5">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => updateBrandColor(e.target.value)}
                  className="h-11 w-11 cursor-pointer rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-1 focus:outline-none"
                />
                <span className="font-mono text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {brandColor}
                </span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2.5">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Popular Presets</span>
              <div className="grid grid-cols-2 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => updateBrandColor(color.hex)}
                    className="flex items-center gap-2.5 rounded-xl border border-gray-150 dark:border-gray-800 p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-150 group"
                  >
                    <span 
                      className="h-4.5 w-4.5 rounded-lg shrink-0 border border-black/5" 
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white truncate">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings form */}
        <form onSubmit={handleProfileSave} className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm space-y-6 lg:col-span-2">
          <div className="border-b border-gray-150 dark:border-gray-800 pb-4">
            <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">Workspace Profile</h3>
            <p className="text-xs text-gray-400 mt-1">Details applied as sender data on classic and modern invoice cards.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Your Full Name</label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-transparent py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Business Name</label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Building className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="block w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-transparent py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)]"
                  placeholder="ACME Corp"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Business Address</label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  className="block w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-transparent py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)]"
                  placeholder="123 Financial Row, City, Country"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Invoice Number Prefix</label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <FolderKey className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  required
                  type="text"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleInputChange}
                  className="block w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-transparent py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Currency Preference</label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  name="defaultCurrency"
                  value={formData.defaultCurrency}
                  onChange={handleInputChange}
                  className="block w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-transparent py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)] uppercase font-mono cursor-pointer"
                >
                  <option value="USD" className="dark:bg-gray-950">USD ($ - US Dollar)</option>
                  <option value="EUR" className="dark:bg-gray-950">EUR (€ - Euro)</option>
                  <option value="GBP" className="dark:bg-gray-950">GBP (£ - British Pound)</option>
                  <option value="INR" className="dark:bg-gray-950">INR (₹ - Indian Rupee)</option>
                  <option value="JPY" className="dark:bg-gray-950">JPY (¥ - Japanese Yen)</option>
                  <option value="CAD" className="dark:bg-gray-950">CAD ($ - Canadian Dollar)</option>
                  <option value="AUD" className="dark:bg-gray-950">AUD ($ - Australian Dollar)</option>
                  <option value="AED" className="dark:bg-gray-950">AED (د.إ - UAE Dirham)</option>
                  <option value="SGD" className="dark:bg-gray-950">SGD ($ - Singapore Dollar)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Default Tax (%)</label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Percent className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  required
                  type="number"
                  name="defaultTaxPercentage"
                  value={formData.defaultTaxPercentage}
                  onChange={handleInputChange}
                  className="block w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-transparent py-3 pl-11 pr-4 text-sm text-gray-900 dark:text-white outline-none focus:border-[var(--brand-color)]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-color)] px-5 py-3.5 text-sm font-bold text-white shadow-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              style={{ boxShadow: '0 4px 16px var(--brand-glow)' }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Workspace Details</span>
            </button>
          </div>
        </form>

      </div>

      {/* Security GDPR and Dangerous Purge Panels */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 pt-6 border-t border-gray-200 dark:border-gray-800">
        
        {/* GDPR Export */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-[#0a0a0a] p-6 shadow-sm space-y-4">
          <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">GDPR Compliance & Portability</h3>
          <p className="text-xs text-gray-400">
            In compliance with general data protection regulations, you can download a complete backup report of all user profiles and matching invoice records.
          </p>
          <button
            onClick={handleGDPRDataExport}
            disabled={exportLoading}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-3.5 px-5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>Export Workspace Data</span>
          </button>
        </div>

        {/* Account Deletion */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.02] p-6 shadow-sm space-y-4">
          <h3 className="font-heading text-lg font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 animate-bounce" />
            Danger Zone
          </h3>
          <p className="text-xs text-red-400/80">
            Once you delete your account, your data will be permanently deleted and cannot be recovered.
          </p>
          
          {showDeleteModal ? (
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-red-400">
                Type &ldquo;DELETE MY ACCOUNT&rdquo; to confirm
              </label>
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="block w-full rounded-2xl border border-red-500/30 bg-transparent py-3 px-4 text-sm text-red-500 outline-none focus:border-red-500"
                placeholder="DELETE MY ACCOUNT"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
                  <span>Permanently Purge Workspace</span>
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-xs font-bold text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/15 border border-red-500/20 px-5 py-3.5 text-sm font-bold transition-all duration-200"
            >
              <Trash className="h-4 w-4" />
              <span>Request Account Deletion</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
