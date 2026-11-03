import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useAlerts() {
  const [alerts, setAlerts] = useState({
    lowStock: [],
    supplierDebts: [],
    customerDebts: [],
    pendingTransactions: 0,
    loading: true,
  });

  const fetchAlerts = useCallback(async () => {
    try {
      const [prodRes, supRes, supPayRes, custDebtRes, txnRes] =
        await Promise.all([
          // أصناف قليلة
          supabase
            .from('inv_products')
            .select('id, name, unit, current_stock, min_threshold')
            .eq('is_disabled', false),
          // مشتريات الموردين
          supabase.from('inv_supplies').select('supplier_id, total_amount'),
          // مدفوعات الموردين
          supabase.from('inv_supplier_payments').select('supplier_id, amount'),
          // مديونيات العملاء
          supabase
            .from('app_debts')
            .select('amount, status, customer_id, app_customers(name)')
            .eq('status', 'open'),
          // حركات العمال المعلقة
          supabase
            .from('app_transactions')
            .select('id')
            .is('closing_id', null),
        ]);

      // 1. أصناف قليلة
      const lowStock = (prodRes.data || []).filter(
        (p) => Number(p.current_stock) <= Number(p.min_threshold)
      );

      // 2. ديون الموردين
      const purchasesMap = {};
      (supRes.data || []).forEach((s) => {
        if (!s.supplier_id) return;
        purchasesMap[s.supplier_id] =
          (purchasesMap[s.supplier_id] || 0) + Number(s.total_amount || 0);
      });
      const paymentsMap = {};
      (supPayRes.data || []).forEach((p) => {
        paymentsMap[p.supplier_id] =
          (paymentsMap[p.supplier_id] || 0) + Number(p.amount || 0);
      });
      const supplierDebts = Object.keys(purchasesMap)
        .map((id) => {
          const remaining =
            (purchasesMap[id] || 0) - (paymentsMap[id] || 0);
          return { supplierId: id, remaining };
        })
        .filter((s) => s.remaining > 0);

      // 3. مديونيات العملاء
      const customerDebtsMap = {};
      (custDebtRes.data || []).forEach((d) => {
        const key = d.customer_id;
        if (!customerDebtsMap[key]) {
          customerDebtsMap[key] = {
            customerId: key,
            name: d.app_customers?.name || '—',
            total: 0,
          };
        }
        customerDebtsMap[key].total += Number(d.amount || 0);
      });
      const customerDebts = Object.values(customerDebtsMap);

      setAlerts({
        lowStock,
        supplierDebts,
        customerDebts,
        pendingTransactions: txnRes.data?.length || 0,
        loading: false,
      });
    } catch (e) {
      console.error('useAlerts error:', e);
      setAlerts((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // تحديث كل 60 ثانية
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const totalCount =
    alerts.lowStock.length +
    alerts.supplierDebts.length +
    alerts.pendingTransactions;

  return { ...alerts, totalCount, refetch: fetchAlerts };
}