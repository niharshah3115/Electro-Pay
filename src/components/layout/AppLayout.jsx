import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { ShopkeeperFormModal } from '../shopkeepers/ShopkeeperFormModal';
import { RecordPaymentModal } from '../payments/RecordPaymentModal';
import { LogCallModal } from '../reminders/LogCallModal';
import { WhatsAppMessagePreviewModal } from '../reminders/WhatsAppMessagePreviewModal';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopkeeperModalOpen, setShopkeeperModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [logCallModalData, setLogCallModalData] = useState(null);
  const [whatsappModalData, setWhatsappModalData] = useState(null);
  const [prefilledShopkeeperId, setPrefilledShopkeeperId] = useState(null);

  // Quick Action Handlers
  const handleOpenAddShopkeeper = () => {
    setShopkeeperModalOpen(true);
  };

  const handleOpenRecordPayment = (shopkeeperId = null) => {
    setPrefilledShopkeeperId(shopkeeperId);
    setPaymentModalOpen(true);
  };

  const handleOpenLogCall = (shopkeeper) => {
    setLogCallModalData(shopkeeper);
  };

  const handleOpenWhatsApp = ({ shopkeeper }) => {
    setWhatsappModalData({ shopkeeper });
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 max-w-xs flex-1 flex-col bg-slate-950 z-10 shadow-2xl">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAddShopkeeper={handleOpenAddShopkeeper}
          onOpenRecordPayment={() => handleOpenRecordPayment()}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <Outlet
            context={{
              onOpenAddShopkeeper: handleOpenAddShopkeeper,
              onOpenRecordPayment: handleOpenRecordPayment,
              onOpenLogCall: handleOpenLogCall,
              onOpenWhatsApp: handleOpenWhatsApp,
            }}
          />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>

      {/* Global Modals */}
      <ShopkeeperFormModal
        isOpen={shopkeeperModalOpen}
        onClose={() => setShopkeeperModalOpen(false)}
      />

      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPrefilledShopkeeperId(null);
        }}
        prefilledShopkeeperId={prefilledShopkeeperId}
      />

      <LogCallModal
        isOpen={!!logCallModalData}
        onClose={() => setLogCallModalData(null)}
        shopkeeper={logCallModalData}
      />

      <WhatsAppMessagePreviewModal
        isOpen={!!whatsappModalData}
        onClose={() => setWhatsappModalData(null)}
        data={whatsappModalData}
      />
    </div>
  );
}
