import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  db,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from '../services/firebase';
import { getTodayString, calculateDueDate } from '../utils/dateUtils';
import { DEFAULT_CREDIT_DAYS } from '../constants/creditConfig';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../constants/defaultTemplates';

/**
 * Consolidates duplicate shopkeeper records by normalized shopName or phone number.
 */
export function consolidateShopkeepers(rawShopkeepers, rawPayments = []) {
  if (!Array.isArray(rawShopkeepers) || rawShopkeepers.length === 0) {
    return { shopkeepers: [], payments: rawPayments };
  }

  const idMap = new Map(); // oldId -> canonicalId
  const groups = new Map(); // canonicalKey -> mergedSk

  for (const sk of rawShopkeepers) {
    if (!sk) continue;
    const normName = (sk.shopName || sk.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const cleanPhone = (sk.phone || '').trim().replace(/\D/g, '');
    
    // Canonical key: prefer normalized name, then phone (if valid), else unique id
    const key = normName || (cleanPhone.length >= 8 ? cleanPhone.slice(-10) : sk.id);

    if (groups.has(key)) {
      const existing = groups.get(key);
      idMap.set(sk.id, existing.id);

      const addedOutstanding = Number(sk.totalOutstanding) || 0;
      const addedPaid = Number(sk.totalPaidAmount) || 0;
      const addedBilled = Number(sk.billAmount) || (addedOutstanding + addedPaid);

      const existingOrders = Array.isArray(existing.orders) ? existing.orders : [];
      const skOrders = Array.isArray(sk.orders) ? sk.orders : (
        addedBilled > 0
          ? [{
              orderId: 'ord_' + (sk.id || Date.now().toString(36)),
              amount: addedBilled,
              billingType: sk.billingType || 'with_bill',
              invoiceNumber: sk.invoiceNumber || 'INV-GENERAL',
              challanNumber: sk.challanNumber || '',
              deliveryDate: sk.deliveryDate || sk.invoiceDate || sk.createdAt || getTodayString(),
              dueDate: sk.dueDate || '',
              createdAt: sk.createdAt || new Date().toISOString(),
            }]
          : []
      );

      groups.set(key, {
        ...existing,
        totalOutstanding: (Number(existing.totalOutstanding) || 0) + addedOutstanding,
        totalPaidAmount: (Number(existing.totalPaidAmount) || 0) + addedPaid,
        billAmount: (Number(existing.billAmount) || 0) + addedBilled,
        phone: existing.phone || sk.phone,
        deliveryDate: sk.deliveryDate || existing.deliveryDate,
        dueDate: sk.dueDate || existing.dueDate,
        orders: [...skOrders, ...existingOrders],
      });
    } else {
      const initialOrders = Array.isArray(sk.orders) ? sk.orders : (
        (sk.billAmount || sk.totalOutstanding)
          ? [{
              orderId: 'ord_' + (sk.id || Date.now().toString(36)),
              amount: Number(sk.billAmount || sk.totalOutstanding) || 0,
              billingType: sk.billingType || 'with_bill',
              invoiceNumber: sk.invoiceNumber || 'INV-GENERAL',
              challanNumber: sk.challanNumber || '',
              deliveryDate: sk.deliveryDate || sk.invoiceDate || sk.createdAt || getTodayString(),
              dueDate: sk.dueDate || '',
              createdAt: sk.createdAt || new Date().toISOString(),
            }]
          : []
      );

      const canonicalSk = {
        ...sk,
        orders: initialOrders,
      };
      groups.set(key, canonicalSk);
      idMap.set(sk.id, sk.id);
    }
  }

  const mergedShopkeepers = Array.from(groups.values());
  mergedShopkeepers.sort((a, b) => (a.shopName || '').localeCompare(b.shopName || ''));

  const updatedPayments = (rawPayments || []).map((p) => {
    if (p.shopkeeperId && idMap.has(p.shopkeeperId)) {
      return { ...p, shopkeeperId: idMap.get(p.shopkeeperId) };
    }
    return p;
  });

  return { shopkeepers: mergedShopkeepers, payments: updatedPayments };
}

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { currentUser, isAuthenticated, isCloudConnected } = useAuth();
  const { success } = useToast();

  const storageKey = useMemo(() => {
    return currentUser?.uid ? `electrotrack_db_${currentUser.uid}` : 'electrotrack_db_guest';
  }, [currentUser?.uid]);

  // State
  const [shopkeepers, setShopkeepers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [businessProfile, setBusinessProfile] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    upiId: '',
    gstin: '',
    address: '',
    defaultCreditDays: DEFAULT_CREDIT_DAYS,
    currency: 'INR',
  });
  const [reminderTemplates, setReminderTemplates] = useState(DEFAULT_WHATSAPP_TEMPLATES);
  const [loading, setLoading] = useState(true);

  // Helper to persist local store when not on Cloud Firestore
  const saveToLocalStore = useCallback((updater) => {
    try {
      const current = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [storageKey]);

  // Synchronize state
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.uid) {
      setShopkeepers([]);
      setPayments([]);
      setCallLogs([]);
      setLoading(false);
      return;
    }

    const uid = currentUser.uid;

    if (isCloudConnected && db) {
      // 1. LIVE CLOUD FIRESTORE SUBSCRIPTIONS
      setLoading(true);
      const unsubscribers = [];

      try {
        // Distributor Profile
        const profileRef = doc(db, 'distributors', uid);
        const unsubProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setBusinessProfile((prev) => ({
              ...prev,
              ...data,
              businessName: data.businessName || currentUser.displayName || 'Electrical Distributor',
              email: currentUser.email,
            }));
            if (data.reminderTemplates) setReminderTemplates(data.reminderTemplates);
          } else {
            const init = {
              businessName: currentUser.displayName || 'Electrical Distributor',
              email: currentUser.email,
              defaultCreditDays: DEFAULT_CREDIT_DAYS,
              createdAt: serverTimestamp(),
            };
            setDoc(profileRef, init, { merge: true }).catch(console.warn);
            setBusinessProfile((prev) => ({ ...prev, ...init }));
          }
        });
        unsubscribers.push(unsubProfile);

        // Shopkeepers
        const skQuery = query(collection(db, 'shopkeepers'), where('distributorId', '==', uid));
        const unsubSk = onSnapshot(skQuery, (snap) => {
          const rawList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const { shopkeepers: cleanShopkeepers } = consolidateShopkeepers(rawList);
          setShopkeepers(cleanShopkeepers);
        });
        unsubscribers.push(unsubSk);

        // Payments
        const payQuery = query(collection(db, 'payments'), where('distributorId', '==', uid));
        const unsubPay = onSnapshot(payQuery, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
          setPayments(list);
        });
        unsubscribers.push(unsubPay);

        // Call Logs
        const callQuery = query(collection(db, 'callLogs'), where('distributorId', '==', uid));
        const unsubCall = onSnapshot(callQuery, (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => new Date(b.calledAt) - new Date(a.calledAt));
          setCallLogs(list);
        });
        unsubscribers.push(unsubCall);

      } catch (err) {
        console.warn('Firestore live subscription fallback:', err);
      } finally {
        setLoading(false);
      }

      return () => {
        unsubscribers.forEach((u) => typeof u === 'function' && u());
      };
    } else {
      // 2. LOCAL ADAPTER REPOSITORY (Scoped per user)
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const { shopkeepers: cleanShopkeepers, payments: cleanPayments } = consolidateShopkeepers(
            parsed.shopkeepers || [],
            parsed.payments || []
          );

          setShopkeepers(cleanShopkeepers);
          setPayments(cleanPayments);
          setCallLogs(parsed.callLogs || []);
          setBusinessProfile(
            parsed.businessProfile || {
              businessName: currentUser.displayName || 'Electrical Distributor',
              email: currentUser.email,
              defaultCreditDays: DEFAULT_CREDIT_DAYS,
            }
          );
          setReminderTemplates(parsed.reminderTemplates || DEFAULT_WHATSAPP_TEMPLATES);

          // Auto-persist cleaned consolidated data if duplicates existed
          if (cleanShopkeepers.length !== (parsed.shopkeepers || []).length) {
            saveToLocalStore({ shopkeepers: cleanShopkeepers, payments: cleanPayments });
          }
        } else {
          const emptyState = {
            shopkeepers: [],
            payments: [],
            callLogs: [],
            businessProfile: {
              businessName: currentUser.displayName || 'Electrical Distributor',
              email: currentUser.email,
              defaultCreditDays: DEFAULT_CREDIT_DAYS,
            },
            reminderTemplates: DEFAULT_WHATSAPP_TEMPLATES,
          };
          localStorage.setItem(storageKey, JSON.stringify(emptyState));
          setShopkeepers([]);
          setPayments([]);
          setCallLogs([]);
          setBusinessProfile(emptyState.businessProfile);
          setReminderTemplates(emptyState.reminderTemplates);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  }, [isAuthenticated, currentUser?.uid, currentUser?.email, currentUser?.displayName, isCloudConnected, storageKey, saveToLocalStore]);

  // ==========================================
  // SHOPKEEPER ACTIONS
  // ==========================================
  const addShopkeeper = async (data) => {
    if (!currentUser?.uid) return;

    const cleanInputName = (data.shopName || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const cleanPhone = (data.phone || '').trim().replace(/\D/g, '');

    // Check if an existing shopkeeper already exists with matching id, name, or phone
    const existingSk = shopkeepers.find((s) => {
      if (data.id && s.id === data.id) return true;
      const existingName = (s.shopName || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const existingPhone = (s.phone || '').trim().replace(/\D/g, '');
      const matchName = cleanInputName && existingName === cleanInputName;
      const matchPhone = cleanPhone.length >= 8 && existingPhone.length >= 8 && cleanPhone.slice(-10) === existingPhone.slice(-10);
      return matchName || matchPhone;
    });

    const creditDays = Number(data.creditDays) || businessProfile.defaultCreditDays || 39;
    const newBill = Number(data.billAmount) || 0;
    const deliveryDate = data.deliveryDate || getTodayString();
    const dueDate = data.dueDate || calculateDueDate(deliveryDate, creditDays);

    if (existingSk) {
      // Repeat purchase on existing shopkeeper account: Do not create a new shopkeeper!
      const currentOutstanding = Number(existingSk.totalOutstanding) || 0;
      const currentTotalBilled = Number(existingSk.billAmount) || currentOutstanding;
      const newOutstanding = currentOutstanding + newBill;
      const newTotalBilled = currentTotalBilled + newBill;

      const orderItem = {
        orderId: 'ord_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4),
        amount: newBill,
        billingType: data.billingType || existingSk.billingType || 'with_bill',
        invoiceNumber: data.billingType === 'without_bill'
          ? (data.challanNumber || `CH-${Date.now().toString().slice(-4)}`)
          : (data.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`),
        challanNumber: data.billingType === 'without_bill' ? (data.challanNumber || '') : '',
        deliveryDate,
        dueDate,
        createdAt: new Date().toISOString(),
      };

      const existingOrders = Array.isArray(existingSk.orders) ? existingSk.orders : (
        (existingSk.billAmount || existingSk.totalOutstanding)
          ? [{
              orderId: 'ord_init_' + (existingSk.id || '1'),
              amount: Number(existingSk.billAmount || existingSk.totalOutstanding) || 0,
              billingType: existingSk.billingType || 'with_bill',
              invoiceNumber: existingSk.invoiceNumber || 'INV-1001',
              challanNumber: existingSk.challanNumber || '',
              deliveryDate: existingSk.deliveryDate || existingSk.invoiceDate || getTodayString(),
              dueDate: existingSk.dueDate || getTodayString(),
              createdAt: existingSk.createdAt || new Date().toISOString(),
            }]
          : []
      );

      const updatedOrders = [orderItem, ...existingOrders];

      const updates = {
        totalOutstanding: newOutstanding,
        billAmount: newTotalBilled,
        deliveryDate,
        dueDate,
        billingType: data.billingType || existingSk.billingType,
        invoiceNumber: orderItem.invoiceNumber,
        challanNumber: orderItem.challanNumber,
        phone: data.phone?.trim() || existingSk.phone,
        orders: updatedOrders,
      };

      if (isCloudConnected && db) {
        await updateDoc(doc(db, 'shopkeepers', existingSk.id), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } else {
        const nextShopkeepers = shopkeepers.map((s) =>
          s.id === existingSk.id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        );
        setShopkeepers(nextShopkeepers);
        saveToLocalStore({ shopkeepers: nextShopkeepers });
      }

      success(
        'Repeat Purchase Added',
        `Added ₹${newBill.toLocaleString('en-IN')} order to "${existingSk.shopName}". Total outstanding is now ₹${newOutstanding.toLocaleString('en-IN')}.`
      );
      return existingSk.id;
    } else {
      // New Shopkeeper Registration: Adds exactly one new shopkeeper!
      const initialOrder = {
        orderId: 'ord_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4),
        amount: newBill,
        billingType: data.billingType || 'with_bill',
        invoiceNumber: data.invoiceNumber || (data.billingType === 'without_bill' ? '' : `INV-${Date.now().toString().slice(-4)}`),
        challanNumber: data.challanNumber || (data.billingType === 'without_bill' ? `CH-${Date.now().toString().slice(-4)}` : ''),
        deliveryDate,
        dueDate,
        createdAt: new Date().toISOString(),
      };

      if (isCloudConnected && db) {
        const skRef = doc(collection(db, 'shopkeepers'));
        const skDoc = {
          ...data,
          distributorId: currentUser.uid,
          deliveryDate,
          dueDate,
          billAmount: newBill,
          totalOutstanding: newBill,
          totalPaidAmount: 0,
          creditDays,
          orders: [initialOrder],
          createdAt: serverTimestamp(),
        };
        await setDoc(skRef, skDoc);
        success('Shopkeeper Added', `"${data.shopName}" registered with ₹${newBill.toLocaleString('en-IN')} bill amount.`);
        return skRef.id;
      } else {
        const newSkId = 'sk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
        const newSk = {
          id: newSkId,
          ...data,
          deliveryDate,
          dueDate,
          billAmount: newBill,
          totalOutstanding: newBill,
          totalPaidAmount: 0,
          creditDays,
          orders: [initialOrder],
          createdAt: new Date().toISOString(),
        };

        const nextShopkeepers = [...shopkeepers, newSk];
        setShopkeepers(nextShopkeepers);
        saveToLocalStore({ shopkeepers: nextShopkeepers });

        success('Shopkeeper Added', `"${data.shopName}" registered with ₹${newBill.toLocaleString('en-IN')} bill amount.`);
        return newSkId;
      }
    }
  };

  const updateShopkeeper = async (id, updates) => {
    if (isCloudConnected && db) {
      await updateDoc(doc(db, 'shopkeepers', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } else {
      setShopkeepers((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
        saveToLocalStore({ shopkeepers: next });
        return next;
      });
    }
    success('Shopkeeper Updated', 'Retailer profile updated.');
  };

  const deleteShopkeeper = async (id) => {
    if (isCloudConnected && db) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'shopkeepers', id));

      // Remove associated payments
      const skPayments = payments.filter((p) => p.shopkeeperId === id);
      skPayments.forEach((pay) => {
        batch.delete(doc(db, 'payments', pay.id));
      });

      await batch.commit();
    } else {
      const nextShopkeepers = shopkeepers.filter((s) => s.id !== id);
      const nextPayments = payments.filter((p) => p.shopkeeperId !== id);
      const nextCallLogs = callLogs.filter((c) => c.shopkeeperId !== id);

      setShopkeepers(nextShopkeepers);
      setPayments(nextPayments);
      setCallLogs(nextCallLogs);

      saveToLocalStore({
        shopkeepers: nextShopkeepers,
        payments: nextPayments,
        callLogs: nextCallLogs,
      });
    }
    success('Shopkeeper Deleted', 'Retailer and associated account records removed.');
  };

  // ==========================================
  // PAYMENT ACTIONS
  // ==========================================
  const recordPayment = async (paymentData) => {
    if (!currentUser?.uid) return;

    const amount = Number(paymentData.amount);
    if (!amount || amount <= 0) {
      throw new Error('Please enter a valid payment amount greater than ₹0.');
    }

    const shopkeeperId = paymentData.shopkeeperId;
    const shopkeeper = shopkeepers.find((s) => s.id === shopkeeperId);
    if (!shopkeeper) throw new Error('Shopkeeper not found.');

    const currentDue = Number(shopkeeper.totalOutstanding) || 0;
    if (amount > currentDue) {
      throw new Error(`Payment amount (₹${amount.toLocaleString('en-IN')}) cannot exceed remaining balance (₹${currentDue.toLocaleString('en-IN')}).`);
    }

    const receiptNumber = paymentData.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;
    const invoiceNumber = paymentData.invoiceNumber || shopkeeper.invoiceNumber || `INV-${shopkeeper.id ? shopkeeper.id.slice(-6) : '1001'}`;
    const newOutstanding = Math.max(0, currentDue - amount);
    const newTotalPaid = (Number(shopkeeper.totalPaidAmount) || 0) + amount;
    const paymentStatus = newOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID';

    const paymentRecord = {
      receiptNumber,
      invoiceNumber,
      shopkeeperId,
      shopkeeperName: shopkeeper.shopName,
      ownerName: shopkeeper.ownerName || 'Proprietor',
      amount,
      paymentDate: paymentData.paymentDate || getTodayString(),
      paymentMethod: paymentData.paymentMethod || paymentData.paymentMode || 'upi',
      paymentMode: paymentData.paymentMethod || paymentData.paymentMode || 'upi',
      referenceNumber: paymentData.referenceNumber || '',
      notes: paymentData.notes || '',
      distributorId: currentUser.uid,
    };

    if (isCloudConnected && db) {
      const batch = writeBatch(db);
      const paymentRef = doc(collection(db, 'payments'));

      batch.set(paymentRef, {
        ...paymentRecord,
        createdAt: serverTimestamp(),
      });

      batch.update(doc(db, 'shopkeepers', shopkeeperId), {
        totalOutstanding: newOutstanding,
        totalPaidAmount: newTotalPaid,
        paymentStatus,
        lastPaymentDate: paymentData.paymentDate || getTodayString(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      if (paymentStatus === 'PAID') confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      success('Payment Recorded', `₹${amount.toLocaleString('en-IN')} received. Status: ${paymentStatus.replace('_', ' ')}.`);
      return paymentRef.id;
    } else {
      const newPayment = {
        id: 'pay_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        ...paymentRecord,
        createdAt: new Date().toISOString(),
      };

      const nextPayments = [newPayment, ...payments];
      const nextShopkeepers = shopkeepers.map((s) =>
        s.id === shopkeeperId
          ? {
              ...s,
              totalOutstanding: newOutstanding,
              totalPaidAmount: newTotalPaid,
              paymentStatus,
              lastPaymentDate: paymentData.paymentDate || getTodayString(),
            }
          : s
      );

      setPayments(nextPayments);
      setShopkeepers(nextShopkeepers);
      saveToLocalStore({ payments: nextPayments, shopkeepers: nextShopkeepers });

      if (paymentStatus === 'PAID') confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      success('Payment Recorded', `₹${amount.toLocaleString('en-IN')} received. Status: ${paymentStatus.replace('_', ' ')}.`);
      return newPayment.id;
    }
  };

  const deletePayment = async (id) => {
    const payment = payments.find((p) => p.id === id);
    if (!payment) return;

    const shopkeeperId = payment.shopkeeperId;
    const shopkeeper = shopkeepers.find((s) => s.id === shopkeeperId);
    const amount = Number(payment.amount) || 0;

    const newOutstanding = (Number(shopkeeper?.totalOutstanding) || 0) + amount;
    const newTotalPaid = Math.max(0, (Number(shopkeeper?.totalPaidAmount) || 0) - amount);
    const paymentStatus = newTotalPaid === 0 ? 'UNPAID' : (newOutstanding === 0 ? 'PAID' : 'PARTIALLY_PAID');

    if (isCloudConnected && db) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'payments', id));

      if (shopkeeperId && shopkeeper) {
        batch.update(doc(db, 'shopkeepers', shopkeeperId), {
          totalOutstanding: newOutstanding,
          totalPaidAmount: newTotalPaid,
          paymentStatus,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    } else {
      const nextPayments = payments.filter((p) => p.id !== id);
      const nextShopkeepers = shopkeepers.map((s) => {
        if (s.id === shopkeeperId) {
          return {
            ...s,
            totalOutstanding: newOutstanding,
            totalPaidAmount: newTotalPaid,
            paymentStatus,
          };
        }
        return s;
      });

      setPayments(nextPayments);
      setShopkeepers(nextShopkeepers);
      saveToLocalStore({ payments: nextPayments, shopkeepers: nextShopkeepers });
    }

    success('Payment Deleted', `Receipt #${payment.receiptNumber} deleted and balance restored.`);
  };

  // ==========================================
  // CALL LOGGING
  // ==========================================
  const logCall = async (callData) => {
    if (!currentUser?.uid) return;

    if (isCloudConnected && db) {
      const batch = writeBatch(db);
      const callRef = doc(collection(db, 'callLogs'));
      batch.set(callRef, {
        ...callData,
        distributorId: currentUser.uid,
        calledAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

      if (callData.shopkeeperId) {
        batch.update(doc(db, 'shopkeepers', callData.shopkeeperId), {
          lastCallDate: getTodayString(),
          lastCallOutcome: callData.outcome || '',
          nextFollowUpDate: callData.nextFollowUpDate || null,
        });
      }
      await batch.commit();
    } else {
      const newCall = {
        id: 'call_' + Date.now().toString(36),
        ...callData,
        calledAt: new Date().toISOString(),
      };
      const nextCalls = [newCall, ...callLogs];
      const nextShopkeepers = shopkeepers.map((s) =>
        s.id === callData.shopkeeperId
          ? { ...s, lastCallDate: getTodayString(), lastCallOutcome: callData.outcome || '', nextFollowUpDate: callData.nextFollowUpDate || null }
          : s
      );
      setCallLogs(nextCalls);
      setShopkeepers(nextShopkeepers);
      saveToLocalStore({ callLogs: nextCalls, shopkeepers: nextShopkeepers });
    }
    success('Call Logged', 'Follow-up outcome saved.');
  };

  // ==========================================
  // PROFILE & TEMPLATES
  // ==========================================
  const updateBusinessProfile = async (profileUpdates) => {
    if (!currentUser?.uid) return;
    if (isCloudConnected && db) {
      await setDoc(doc(db, 'distributors', currentUser.uid), profileUpdates, { merge: true });
    } else {
      saveToLocalStore((prev) => ({
        ...prev,
        businessProfile: { ...prev.businessProfile, ...profileUpdates },
      }));
    }
    setBusinessProfile((prev) => ({ ...prev, ...profileUpdates }));
    success('Settings Saved', 'Distributor profile updated.');
  };

  const updateReminderTemplates = async (newTemplates) => {
    if (!currentUser?.uid) return;
    if (isCloudConnected && db) {
      await setDoc(doc(db, 'distributors', currentUser.uid), { reminderTemplates: newTemplates }, { merge: true });
    } else {
      saveToLocalStore((prev) => ({ ...prev, reminderTemplates: newTemplates }));
    }
    setReminderTemplates(newTemplates);
    success('Templates Saved', 'WhatsApp templates updated.');
  };

  const value = {
    shopkeepers,
    payments,
    callLogs,
    businessProfile,
    reminderTemplates,
    loading,
    addShopkeeper,
    updateShopkeeper,
    deleteShopkeeper,
    recordPayment,
    deletePayment,
    logCall,
    updateBusinessProfile,
    updateReminderTemplates,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    return {
      shopkeepers: [],
      payments: [],
      callLogs: [],
      businessProfile: { businessName: 'Electrical Distributor', defaultCreditDays: 39 },
      reminderTemplates: DEFAULT_WHATSAPP_TEMPLATES,
      loading: false,
      addShopkeeper: async () => {},
      updateShopkeeper: async () => {},
      deleteShopkeeper: async () => {},
      recordPayment: async () => {},
      deletePayment: async () => {},
      logCall: async () => {},
      updateBusinessProfile: async () => {},
      updateReminderTemplates: async () => {},
    };
  }
  return context;
}
