'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Trash2, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon,
  ChevronsUpDown,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  Clock
} from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { useTheme } from '@/auth/ThemeContext';
import { RequireAuth } from '@/components/RequireAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to Invoicon', message: 'Your account is ready. Start creating beautiful invoices!', time: 'Just now', type: 'info', read: false },
    { id: 2, title: 'New Template Added', message: 'The "Retail & Shop" template is now available in the gallery.', time: '2 hours ago', type: 'success', read: false },
    { id: 3, title: 'Profile Updated', message: 'Your business details have been saved successfully.', time: '1 day ago', type: 'success', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAllAsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Trash Bin', href: '/trash', icon: Trash2 },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#000000] transition-colors duration-300">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Sidebar Container */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] px-6 py-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <span className="font-heading text-2xl font-black tracking-tighter text-[var(--brand-color)] drop-shadow-sm uppercase transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_15px_var(--brand-glow)] hover:brightness-125 cursor-pointer">
                INVOICON
              </span>
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-10 flex-1 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 rounded-2xl py-3.5 px-4 text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-[var(--brand-color)] text-white shadow-md' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  style={isActive ? { boxShadow: '0 4px 12px var(--brand-glow)' } : {}}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer Card */}
          <div className="relative border-t border-gray-100 dark:border-gray-800 pt-6">
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex w-full items-center gap-3.5 rounded-2xl p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-color)] text-white font-bold text-sm" style={{ boxShadow: '0 2px 8px var(--brand-glow)' }}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="truncate text-sm font-bold text-gray-900 dark:text-white">{user?.name}</h4>
                <p className="truncate text-xs text-gray-400">{user?.email}</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <>
                <div onClick={() => setProfileDropdownOpen(false)} className="fixed inset-0 z-10" />
                <div className="absolute bottom-16 left-0 z-20 w-full rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <Link 
                    href="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span>My Profile</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Content Shell */}
        <div className="flex flex-1 flex-col overflow-hidden">
          
          {/* Header Bar */}
          <header className="flex h-20 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] px-6 lg:px-10 transition-colors duration-300">
            {/* Sidebar Toggle & Title */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="hidden text-sm font-semibold text-gray-400 dark:text-gray-500 md:block uppercase tracking-wider">
                {pathname === '/dashboard' ? 'Overview Cockpit' : pathname.split('/')[1]}
              </h2>
            </div>

            {/* Quick Actions Header Widgets */}
            <div className="flex items-center gap-3.5">
              
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

              {/* Notification Widget */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  <Bell className="h-4 w-4" />
                </button>
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0a0a0a]">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  </span>
                )}
                
                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] shadow-2xl z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 px-4 py-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-color)] hover:text-[var(--brand-dark)] transition-colors">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {notifications.map(n => (
                              <div key={n.id} className={`flex gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/30 ${n.read ? 'opacity-60' : ''}`}>
                                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                  n.type === 'success' ? 'bg-green-500/10 text-green-500' :
                                  n.type === 'info' ? 'bg-[var(--brand-color)]/10 text-[var(--brand-color)]' :
                                  'bg-red-500/10 text-red-500'
                                }`}>
                                  {n.type === 'success' ? <CheckCircle className="h-4 w-4" /> : n.type === 'info' ? <Info className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={`text-sm font-semibold ${n.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{n.title}</h4>
                                    <span className="shrink-0 text-[10px] font-medium text-gray-400">{n.time}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{n.message}</p>
                                </div>
                                {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-color)] shadow-[0_0_8px_var(--brand-glow)]" />}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Bell className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-700" />
                            <p className="text-sm font-medium text-gray-500">All caught up!</p>
                            <p className="text-xs text-gray-400 mt-1">No new notifications.</p>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 p-2">
                        <button onClick={() => setNotificationsOpen(false)} className="w-full rounded-lg py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Header Profile Widget */}
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-850" />
              
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-850 font-bold text-gray-700 dark:text-gray-300">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user?.name}</h4>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[var(--brand-color)] leading-none mt-1 inline-block">
                    {user?.plan === 'pro' ? 'PRO LICENSE' : 'FREE ACCOUNT'}
                  </span>
                </div>
              </div>

            </div>
          </header>

          {/* Page Body Viewport */}
          <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>

      </div>
    </RequireAuth>
  );
}
