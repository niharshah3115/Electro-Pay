import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PhoneCall, Users, Receipt, BarChart3 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

export function MobileBottomNav() {
  const { shopkeepers = [] } = useBusiness();
  const dueCount = shopkeepers.filter((sk) => (sk.totalOutstanding || 0) > 0).length;

  const tabs = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Shopkeepers', href: '/shopkeepers', icon: Users },
    {
      name: 'Reminders',
      href: '/reminders',
      icon: PhoneCall,
      badge: dueCount > 0 ? dueCount : null,
    },
    { name: 'Payments', href: '/payments', icon: Receipt },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-brand-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <div className="relative">
              <tab.icon className="w-5 h-5" />
              {tab.badge && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1">{tab.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
