import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  PhoneCall,
  BarChart3,
  Settings,
  Zap,
  LogOut,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/currencyUtils';

export function Sidebar({ onClose }) {
  const { shopkeepers = [], payments = [], businessProfile = {} } = useBusiness();
  const { logout, currentUser } = useAuth();

  const totalOutstanding = (shopkeepers || []).reduce((sum, sk) => sum + (Number(sk?.totalOutstanding) || 0), 0);
  const shopkeepersWithDue = (shopkeepers || []).filter((sk) => (sk?.totalOutstanding || 0) > 0).length;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Shopkeepers', href: '/shopkeepers', icon: Users, count: shopkeepers.length },
    {
      name: 'Call & Reminders',
      href: '/reminders',
      icon: PhoneCall,
      badge: shopkeepersWithDue > 0 ? `${shopkeepersWithDue} Due` : null,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    { name: 'Payments', href: '/payments', icon: Receipt, count: payments.length },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-full flex-col justify-between bg-slate-950 border-r border-slate-800/80 p-4 w-72 text-slate-100 select-none">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 border border-brand-300/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">ElectroTrack</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[170px]">
              {businessProfile?.businessName || currentUser?.displayName || 'Electrical Distributor'}
            </p>
          </div>
        </div>

        {/* Total Outstanding Snapshot Pill */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-brand-950/40 border border-brand-500/20 shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Market Due</span>
            <span className="text-amber-400 font-semibold">39-Day Cycle</span>
          </div>
          <div className="text-xl font-bold text-white mt-1 tracking-tight">
            {formatINR(totalOutstanding)}
          </div>
          {shopkeepersWithDue > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>{shopkeepersWithDue} shopkeepers with pending due</span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 border border-brand-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
              {item.count !== undefined && !item.badge && (
                <span className="text-xs text-slate-500 group-hover:text-slate-300 font-mono">
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / Profile & Logout */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
              {currentUser?.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'ED'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.displayName || 'Distributor'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'Active'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
