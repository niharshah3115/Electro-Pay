import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Plus, Store, User } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { ShopkeeperCard } from '../components/shopkeepers/ShopkeeperCard';
import { ShopkeeperFormModal } from '../components/shopkeepers/ShopkeeperFormModal';
import { SearchFilterBar } from '../components/common/SearchFilterBar';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR } from '../utils/currencyUtils';

export function ShopkeepersPage() {
  const { shopkeepers = [] } = useBusiness();
  const {
    onOpenRecordPayment = () => {},
    onOpenLogCall = () => {},
    onOpenWhatsApp = () => {},
  } = useOutletContext() || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShopkeeper, setEditingShopkeeper] = useState(null);

  // Counts for filter pills
  const counts = useMemo(() => {
    const withDue = shopkeepers.filter((s) => (Number(s.totalOutstanding) || 0) > 0).length;
    const clear = shopkeepers.filter((s) => (Number(s.totalOutstanding) || 0) === 0).length;
    const withBill = shopkeepers.filter((s) => s.billingType !== 'without_bill' && !s.challanNumber).length;
    const withoutBill = shopkeepers.filter((s) => s.billingType === 'without_bill' || !!s.challanNumber).length;
    return { all: shopkeepers.length, withDue, clear, withBill, withoutBill };
  }, [shopkeepers]);

  const totalOutstanding = shopkeepers.reduce((acc, sk) => acc + (Number(sk.totalOutstanding) || 0), 0);

  const filterPills = [
    { id: 'all', label: 'All Accounts', count: counts.all },
    { id: 'with_bill', label: '🧾 With Bill (GST)', count: counts.withBill },
    { id: 'without_bill', label: '📦 Without Bill (Challan)', count: counts.withoutBill },
    { id: 'with_due', label: 'Pending Dues', count: counts.withDue },
    { id: 'clear', label: 'Zero Due', count: counts.clear },
  ];

  // Filtered shopkeepers list
  const filteredShopkeepers = useMemo(() => {
    return shopkeepers.filter((sk) => {
      const q = searchQuery.toLowerCase().trim();
      const isWithoutBill = sk.billingType === 'without_bill' || !!sk.challanNumber;
      const docNum = isWithoutBill ? (sk.challanNumber || sk.invoiceNumber || '') : (sk.invoiceNumber || '');

      const matchSearch =
        !q ||
        (sk.ownerName && sk.ownerName.toLowerCase().includes(q)) ||
        (sk.shopName && sk.shopName.toLowerCase().includes(q)) ||
        (sk.phone && sk.phone.includes(q)) ||
        (docNum && docNum.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (activeFilter === 'with_bill') return !isWithoutBill;
      if (activeFilter === 'without_bill') return isWithoutBill;
      if (activeFilter === 'with_due') return (Number(sk.totalOutstanding) || 0) > 0;
      if (activeFilter === 'clear') return (Number(sk.totalOutstanding) || 0) === 0;

      return true;
    });
  }, [shopkeepers, searchQuery, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Shopkeepers & Businesses
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
              {shopkeepers.length} Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Directory showing shopkeeper name, business name, phone number, and ledger balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setEditingShopkeeper(null);
              setIsAddModalOpen(true);
            }}
          >
            Add Shopkeeper
          </Button>
        </div>
      </div>

      {/* Snapshot Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Shopkeepers</span>
            <div className="text-xl font-bold text-white mt-0.5">{shopkeepers.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Accounts with Dues</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{counts.withDue}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Market Due</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5 font-sans">{formatINR(totalOutstanding)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search by shopkeeper name, business name, or mobile phone..."
        filters={filterPills}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Shopkeeper Cards Grid */}
      {filteredShopkeepers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Shopkeepers Found"
          description={
            searchQuery
              ? `No accounts matched "${searchQuery}".`
              : 'Add your first shopkeeper with their name, business name, and phone number.'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Add Shopkeeper'}
          onAction={() => {
            if (searchQuery) setSearchQuery('');
            else {
              setEditingShopkeeper(null);
              setIsAddModalOpen(true);
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShopkeepers.map((sk) => (
            <ShopkeeperCard
              key={sk.id}
              shopkeeper={sk}
              onOpenRecordPayment={onOpenRecordPayment}
              onOpenLogCall={onOpenLogCall}
              onOpenWhatsApp={onOpenWhatsApp}
              onOpenEdit={(target) => {
                setEditingShopkeeper(target);
                setIsAddModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Shopkeeper Modal */}
      <ShopkeeperFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingShopkeeper(null);
        }}
        initialData={editingShopkeeper}
      />
    </div>
  );
}
