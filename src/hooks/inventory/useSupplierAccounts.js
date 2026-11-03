import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function useSupplierAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      // جلب الموردين
      const { data: suppliers, error: supErr } = await supabase
        .from('inv_suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (supErr) throw supErr;

      // جلب كل المشتريات
      const { data: supplies, error: sup2Err } = await supabase
        .from('inv_supplies')
        .select('supplier_id, total_amount');

      if (sup2Err) throw sup2Err;

      // جلب كل المدفوعات
      const { data: payments, error: payErr } = await supabase
        .from('inv_supplier_payments')
        .select('supplier_id, amount');

      if (payErr) throw payErr;

      // تجميع
      const purchasesMap = {};
      (supplies || []).forEach((s) => {
        if (!s.supplier_id) return;
        purchasesMap[s.supplier_id] =
          (purchasesMap[s.supplier_id] || 0) + Number(s.total_amount || 0);
      });

      const paymentsMap = {};
      (payments || []).forEach((p) => {
        paymentsMap[p.supplier_id] =
          (paymentsMap[p.supplier_id] || 0) + Number(p.amount || 0);
      });

      const result = (suppliers || []).map((s) => {
        const purchases = purchasesMap[s.id] || 0;
        const paid = paymentsMap[s.id] || 0;
        const remaining = purchases - paid;
        let status;
        if (remaining === 0) status = 'paid';
        else if (remaining > 0) status = 'debt';
        else status = 'overpaid';

        return {
          ...s,
          purchases,
          paid,
          remaining,
          status,
        };
      });

      setAccounts(result);
    } catch (e) {
      console.error(e);
      toast.error('فشل تحميل الحسابات');
    } finally {
      setLoading(false);
    }
  }, []);

  const addPayment = async ({ supplierId, amount, receiverName, method, notes, date }) => {
    // تحقق من المتبقي
    const account = accounts.find((a) => a.id === supplierId);
    if (!account) {
      toast.error('المورد غير موجود');
      return false;
    }
    if (amount > account.remaining) {
      toast.error(`المبلغ أكبر من المتبقي (${account.remaining.toFixed(2)})`);
      return false;
    }

    const { error } = await supabase.from('inv_supplier_payments').insert([
      {
        supplier_id: supplierId,
        amount,
        receiver_name: receiverName,
        payment_method: method,
        payment_date: date,
        notes,
      },
    ]);

    if (error) {
      toast.error('فشل السداد: ' + error.message);
      return false;
    }

    toast.success('✅ تم تسجيل السداد');
    await fetchAccounts();
    return true;
  };

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    loading,
    addPayment,
    refetch: fetchAccounts,
  };
}