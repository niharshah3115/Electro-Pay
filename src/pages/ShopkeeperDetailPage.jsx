import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  FileDown,
  Receipt,
  Edit,
  Trash2,
  MapPin,
  Clock,
  PhoneCall,
  Package,
  Truck,
  Plus,
  FileText,
  ShoppingBag,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PaymentReceiptModal } from '../components/payments/PaymentReceiptModal';
import { ShopkeeperFormModal } from '../components/shopkeepers/ShopkeeperFormModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { formatINR } from '../utils/currencyUtils';
import { formatDate, formatDateTime, getTodayString } from '../utils/dateUtils';
import { generateTelUrl } from '../utils/whatsappUtils';
import { generateShopkeeperStatementPDF } from '../utils/pdfGenerator';
import { CALL_OUTCOMES } from '../constants/callOutcomes';

export function ShopkeeperDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { shopkeepers = [], payments = [], callLogs = [], deleteShopkeeper, deletePayment, businessProfile } = useBusiness();
  const {
    onOpenRecordPayment = () => {},
    onOpenLogCall = () => {},
    onOpenWhatsApp = () => {},
  } = useOutletContext() || {};

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payments' | 'calls'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingShopkeeper, setIsDeletingShopkeeper] = useState(false);

  const shopkeeper = shopkeepers.find((sk) => sk.id === id);

  const ordersList = useMemo(() => {
    if (!shopkeeper) return [];
    if (Array.isArray(shopkeeper.orders) && shopkeeper.orders.length > 0) {
      return shopkeeper.orders;
    }
    const initialAmt = Number(shopkeeper.billAmount || shopkeeper.totalOutstanding || 0);
    if (initialAmt > 0 || shopkeeper.invoiceNumber || shopkeeper.challanNumber) {
      return [{
        orderId: 'ord_init',
        amount: initialAmt,
        billingType: shopkeeper.billingType || (shopkeeper.challanNumber ? 'without_bill' : 'with_bill'),
        invoiceNumber: shopkeeper.invoiceNumber || 'INV-GENERAL',
        challanNumber: shopkeeper.challanNumber || '',
        deliveryDate: shopkeeper.deliveryDate || shopkeeper.invoiceDate || shopkeeper.createdAt?.split('T')[0] || getTodayString(),
        dueDate: shopkeeper.dueDate || '',
      }];
    }
    return [];
  }, [shopkeeper]);

  const skPayments = useMemo(() => {
    return payments.filter((p) => p.shopkeeperId === id);
  }, [payments, id]);

  const skCalls = useMemo(() => {
    return callLogs.filter((c) => c.shopkeeperId === id);
  }, [callLogs, id]);

  if (!shopkeeper) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-base text-slate-300">Shopkeeper not found.</p>
        <Link to="/shopkeepers" className="mt-4 text-xs font-semibold text-brand-400 hover:underline">
          ← Back to Shopkeepers Directory
        </Link>
      </div>
    );
  }

  const outstanding = Number(shopkeeper.totalOutstanding) || 0;
  const totalPaid = Number(shopkeeper.totalPaidAmount) || 0;
  const totalBillAmount = (outstanding + totalPaid) || Number(shopkeeper.billAmount) || 0;

  // Export PDF Statement
  const handleExportPDF = () => {
    generateShopkeeperStatementPDF({
      shopkeeper,
      payments: skPayments,
      businessProfile,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Back Link & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/shopkeepers')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Shopkeepers</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={FileDown}
            onClick={handleExportPDF}
          >
            PDF Statement
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddOrderOpen(true)}
          >
            Add New Order
          </Button>

          <Button
            variant="emerald"
            size="sm"
            icon={Receipt}
            onClick={() => onOpenRecordPayment(shopkeeper.id)}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* 360° Retailer Profile Hero Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl relative overflow-hidden space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Shop Details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {shopkeeper.shopName}
              </h1>
              {outstanding <= 0 ? (
                <Badge variant="emerald" dot size="lg">
                  Zero Due (All Clear)
                </Badge>
              ) : (
                <Badge variant="amber" dot size="lg">
                  Payment Due
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-400">
              {shopkeeper.gstNumber && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">GST:</span>
                  <span className="font-mono text-slate-300 font-semibold">{shopkeeper.gstNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Outstanding Balance Hero Block */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Market Due</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-sans tracking-tight">
              {formatINR(outstanding)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Billed: {formatINR(totalBillAmount)} • Paid: {formatINR(totalPaid)}
            </span>
          </div>
        </div>

        {/* Quick Communication Bar */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={generateTelUrl(shopkeeper.phone)}
              onClick={() => {
                setTimeout(() => onOpenLogCall(shopkeeper), 1500);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors shadow-sm cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              <span>Call ({shopkeeper.phone})</span>
            </a>

            <button
              onClick={() => onOpenWhatsApp({ shopkeeper })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 shadow-sm transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>

            <button
              onClick={() => onOpenLogCall(shopkeeper)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              Log Call Note
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Edit Details"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Delete Shopkeeper"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders & Invoices ({ordersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payment Receipts ({skPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'calls'
              ? 'bg-brand-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Call Logs ({skCalls.length})</span>
        </button>
      </div>

      {/* Tab 1: Orders / Purchases History */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {ordersList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No goods orders or invoices recorded yet.</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                icon={Plus}
                onClick={() => setIsAddOrderOpen(true)}
              >
                Record First Order
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Invoice / Challan #</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Goods Delivered Date</th>
                    <th className="py-3 px-4">Credit Due Date</th>
                    <th className="py-3 px-4 text-right">Order Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {ordersList.map((order, idx) => {
                    const isWithoutBill = order.billingType === 'without_bill' || !!order.challanNumber;
                    const docNumber = isWithoutBill
                      ? (order.challanNumber || order.invoiceNumber || 'CH-GENERAL')
                      : (order.invoiceNumber || 'INV-GENERAL');

                    return (
                      <tr key={order.orderId || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">{idx + 1}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">
                            #{docNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isWithoutBill ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <Package className="w-3 h-3" />
                              Without Bill
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                              <FileText className="w-3 h-3" />
                              With Bill (GST)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                          {formatDate(order.deliveryDate || order.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                          {order.dueDate ? formatDate(order.dueDate) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-amber-400 font-sans text-sm whitespace-nowrap">
                          {formatINR(order.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payments History */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          {skPayments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No payment receipts recorded yet.</p>
              <Button
                variant="emerald"
                size="sm"
                className="mt-3"
                onClick={() => onOpenRecordPayment(shopkeeper.id)}
              >
                Record Payment
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/90 shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Invoice / Bill #</th>
                    <th className="py-3 px-4">Given On Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 hidden md:table-cell">Notes / Ref</th>
                    <th className="py-3 px-4 text-right">Amount Given</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {skPayments.map((payment) => {
                    const method = payment.paymentMethod || payment.paymentMode || 'upi';
                    return (
                      <tr key={payment.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                          {payment.receiptNumber || 'REC'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-brand-300 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-[11px]">
                            #{payment.invoiceNumber || 'INV-GENERAL'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="uppercase font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                            {method.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 hidden md:table-cell truncate max-w-[180px]">
                          {payment.notes ? (
                            <span className="text-slate-200">{payment.notes}</span>
                          ) : (
                            payment.referenceNumber || '—'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 font-sans text-sm whitespace-nowrap">
                          {formatINR(payment.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedPayment(payment)}
                              className="text-xs font-semibold text-brand-400 hover:underline cursor-pointer"
                            >
                              Voucher
                            </button>
                            <button
                              onClick={() => setPaymentToDelete(payment)}
                              className="text-xs font-semibold text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Call History */}
      {activeTab === 'calls' && (
        <div className="space-y-3">
          {skCalls.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">No calls logged yet.</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => onOpenLogCall(shopkeeper)}
              >
                Log First Call Note
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {skCalls.map((call) => {
                const outcomeObj = CALL_OUTCOMES.find((o) => o.id === call.outcome);
                return (
                  <div
                    key={call.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${outcomeObj?.badgeClass || 'bg-slate-800 text-slate-300'}`}>
                          {outcomeObj?.label || call.outcome}
                        </span>
                        <span className="text-slate-400">{formatDateTime(call.calledAt || call.callDate)}</span>
                      </div>
                      {call.notes && <p className="text-slate-200 mt-1">"{call.notes}"</p>}
                    </div>

                    {call.nextFollowUpDate && (
                      <div className="sm:text-right text-slate-400">
                        <span>Follow-up Scheduled:</span>
                        <p className="font-bold text-amber-400">{formatDate(call.nextFollowUpDate)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />

      {/* Edit Shopkeeper Modal */}
      <ShopkeeperFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={shopkeeper}
      />

      {/* Add Repeat Order Modal */}
      <ShopkeeperFormModal
        isOpen={isAddOrderOpen}
        onClose={() => setIsAddOrderOpen(false)}
        initialData={{
          shopName: shopkeeper.shopName,
          phone: shopkeeper.phone,
          billingType: shopkeeper.billingType,
        }}
      />

      {/* Delete Shopkeeper Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={async () => {
          setIsDeletingShopkeeper(true);
          try {
            await deleteShopkeeper(shopkeeper.id);
            setIsDeleteDialogOpen(false);
            navigate('/shopkeepers');
          } catch (err) {
            console.error('Error deleting shopkeeper:', err);
          } finally {
            setIsDeletingShopkeeper(false);
          }
        }}
        title="Delete Shopkeeper?"
        message={`Are you sure you want to remove ${shopkeeper.shopName} from directory? This will remove the retailer and all associated payments.`}
        confirmText="Delete Shopkeeper"
        confirmVariant="danger"
        loading={isDeletingShopkeeper}
      />

      {/* Delete Payment Dialog */}
      <ConfirmDialog
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={async () => {
          if (!paymentToDelete) return;
          setIsDeletingPayment(true);
          try {
            await deletePayment(paymentToDelete.id);
            setPaymentToDelete(null);
          } catch (err) {
            console.error('Error deleting payment:', err);
          } finally {
            setIsDeletingPayment(false);
          }
        }}
        title="Delete Payment Receipt?"
        message={
          paymentToDelete
            ? `Are you sure you want to delete payment receipt #${paymentToDelete.receiptNumber} of ₹${Number(paymentToDelete.amount || 0).toLocaleString('en-IN')}? This will restore the balance.`
            : ''
        }
        confirmText="Delete Payment"
        confirmVariant="danger"
        loading={isDeletingPayment}
      />
    </div>
  );
}
