import React, { useState } from 'react';
import { Building2, MessageSquare, Clock, Save, Smartphone, Download, Cloud, ShieldCheck } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePWA } from '../context/PWAContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export function SettingsPage() {
  const { businessProfile, updateBusinessProfile, reminderTemplates, updateReminderTemplates } = useBusiness();
  const { isCloudConnected, currentUser } = useAuth();
  const { isInstalled, isInstallable, promptInstall, isIOS, isOnline } = usePWA();
  const { success } = useToast();

  const [profile, setProfile] = useState({ ...businessProfile });
  const [templates, setTemplates] = useState({ ...reminderTemplates });
  const [activeTemplateTab, setActiveTemplateTab] = useState('due_today');

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateBusinessProfile(profile);
    success('Settings Saved', 'Distributor business profile updated.');
  };

  const handleSaveTemplates = (e) => {
    e.preventDefault();
    updateReminderTemplates(templates);
    success('Templates Updated', 'Custom WhatsApp payment reminder message templates saved.');
  };

  const templateTokens = [
    '{shop_name}',
    '{owner_name}',
    '{due_amount}',
    '{bill_amount}',
    '{paid_amount}',
    '{upi_id}',
    '{business_name}',
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Distributor Settings & Preferences
          </h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">
            System Preferences
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure distributor profile, standard 39-day credit policy, PWA installation, and automated WhatsApp reminder formats.
        </p>
      </div>

      {/* Cloud Database & Multi-Device Sync Status */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isCloudConnected
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Multi-Device Cloud Sync</h2>
              <p className="text-xs text-slate-400">Google Cloud Firestore & Firebase Authentication</p>
            </div>
          </div>

          <div>
            {isCloudConnected ? (
              <Badge variant="emerald" dot size="md">
                Live Cloud Sync Active ✓
              </Badge>
            ) : (
              <Badge variant="amber" size="md">
                Local Storage Mode
              </Badge>
            )}
          </div>
        </div>

        <div className="pt-1 space-y-2">
          <p className="text-xs sm:text-sm font-semibold text-slate-200">
            {isCloudConnected
              ? 'Your account and data are synchronized across all devices in real-time.'
              : 'App is running in browser local storage mode.'}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isCloudConnected
              ? `Connected to Firebase project (electro-pay-bc98c). Any changes made on this PC or on your mobile device update automatically everywhere.`
              : 'Data is only stored on this individual browser. Connect Firebase in .env to enable multi-device sync.'}
          </p>
        </div>
      </div>

      {/* App Installation Status Section */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">App Installation</h2>
              <p className="text-xs text-slate-400">Progressive Web App (PWA) on Mobile & Desktop</p>
            </div>
          </div>

          <div>
            {isInstalled ? (
              <Badge variant="emerald" dot size="md">
                Installed ✓
              </Badge>
            ) : (
              <Badge variant="amber" size="md">
                Not Installed
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-slate-200">
              {isInstalled
                ? 'ElectroTrack is installed in standalone mode on this device.'
                : 'Install ElectroTrack on your device for faster access.'}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isInstalled
                ? 'Enjoy full-screen distraction-free workspace, 1-tap launcher access, and offline shell caching.'
                : 'Experience native app performance on Android, iOS, Windows, Mac, or Linux without app store downloads.'}
            </p>
          </div>

          {!isInstalled && (
            <div className="shrink-0">
              <Button
                type="button"
                variant="primary"
                icon={Download}
                onClick={promptInstall}
                className="w-full sm:w-auto font-black tracking-wide shadow-lg shadow-brand-500/20 cursor-pointer"
              >
                {isIOS ? 'iOS INSTALL GUIDE' : 'INSTALL APP'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Building2 className="w-5 h-5 text-brand-400" />
          <h2 className="text-base font-bold text-white">Distributor Firm Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Distributor Firm Name"
            value={profile.businessName || ''}
            onChange={(e) => handleProfileChange('businessName', e.target.value)}
            required
            className="sm:col-span-2"
          />

          <Input
            label="Proprietor / Managing Partner"
            value={profile.ownerName || ''}
            onChange={(e) => handleProfileChange('ownerName', e.target.value)}
          />

          <Input
            label="Contact Phone Number"
            value={profile.phone || ''}
            onChange={(e) => handleProfileChange('phone', e.target.value)}
            required
          />

          <Input
            label="UPI ID (VPA) for Collections"
            placeholder="e.g. balajielectricals@okhdfcbank"
            value={profile.upiId || ''}
            onChange={(e) => handleProfileChange('upiId', e.target.value)}
            required
            helperText="Included in WhatsApp payment reminder links"
          />

          <Input
            label="GSTIN Number"
            value={profile.gstin || ''}
            onChange={(e) => handleProfileChange('gstin', e.target.value)}
          />

          <Input
            label="Market Office Address"
            value={profile.address || ''}
            onChange={(e) => handleProfileChange('address', e.target.value)}
            className="sm:col-span-2"
          />
        </div>

        {/* Credit Rules */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Default Credit Policy</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Standard Credit Days"
              type="number"
              min="1"
              max="180"
              value={profile.defaultCreditDays || 35}
              onChange={(e) => handleProfileChange('defaultCreditDays', Number(e.target.value))}
              helperText="Invoices will auto-calculate payment due date by adding this number of days (Default: 35 days)"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <Button type="submit" variant="primary" icon={Save}>
            Save Firm Details
          </Button>
        </div>
      </form>

      {/* WhatsApp Reminder Templates Form */}
      <form onSubmit={handleSaveTemplates} className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">WhatsApp Reminder Message Templates</h2>
        </div>

        {/* Dynamic Tokens Guide */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Available Dynamic Variables (Click to copy/reference)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {templateTokens.map((t) => (
              <span
                key={t}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Template Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTemplateTab('due_today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTemplateTab === 'due_today'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Due Today (35th Day)
          </button>

          <button
            type="button"
            onClick={() => setActiveTemplateTab('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTemplateTab === 'upcoming'
                ? 'bg-brand-500 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Upcoming (3-Day Reminder)
          </button>

          <button
            type="button"
            onClick={() => setActiveTemplateTab('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTemplateTab === 'overdue'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Overdue Alert
          </button>

          <button
            type="button"
            onClick={() => setActiveTemplateTab('statement')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeTemplateTab === 'statement'
                ? 'bg-purple-500 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Full Account Statement
          </button>
        </div>

        {/* Active Template Textarea */}
        <div className="space-y-2">
          <textarea
            rows={5}
            value={templates[activeTemplateTab] || ''}
            onChange={(e) =>
              setTemplates((prev) => ({ ...prev, [activeTemplateTab]: e.target.value }))
            }
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono leading-relaxed resize-y"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="emerald" icon={Save}>
            Save WhatsApp Templates
          </Button>
        </div>
      </form>
    </div>
  );
}

