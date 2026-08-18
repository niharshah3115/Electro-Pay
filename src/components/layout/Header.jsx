import React from 'react';
import { Menu, Plus, Receipt, Users } from 'lucide-react';
import { Button } from '../common/Button';

export function Header({ onOpenMobileMenu, onOpenAddShopkeeper, onOpenRecordPayment }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-xl">
      {/* Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trade Credit Policy:</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
            35 Days Maturity
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Shopkeeper */}
        {onOpenAddShopkeeper && (
          <Button
            variant="outline"
            size="sm"
            icon={Users}
            onClick={onOpenAddShopkeeper}
            className="shadow-sm"
          >
            <span className="hidden sm:inline">Add</span> Shopkeeper
          </Button>
        )}

        {/* Quick Record Payment */}
        <Button
          variant="emerald"
          size="sm"
          icon={Receipt}
          onClick={onOpenRecordPayment}
          className="shadow-sm"
        >
          <span className="hidden sm:inline">Record</span> Payment
        </Button>
      </div>
    </header>
  );
}
