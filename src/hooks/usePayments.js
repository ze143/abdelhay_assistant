import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { nowISO } from '../lib/formatters';
import toast from 'react-hot-toast';

export function usePayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async (customerId = null) => {
    setLoading(true);
    let query = supabase
      .from('app_payments')
      .select('*, app_customers(name)')
      .order('created_at', { ascending: false });
    if (customerId) query = query.eq('customer_id', customerId);
    const { data, error } = await query;
    if (error) {
      toast.error('فشل تحميل المدفوعات: ' + error.message);
      setPayments([]);
    } else {
      setPayments(data || []);
    }
    setLoading(false);
    return data || [];
  }, []);

  /**
   * تسجيل سداد: يضيف payment ويوزع المبلغ على أقدم المديونيات المفتوحة
   */
  const payDebt = async ({ customerId, amount, note }) => {
    // 1) إدخال الـ payment
    const { error: payErr } = await supabase.from('app_payments').insert([
      { customer_id: customerId, amount, note, created_at: nowISO() },
    ]);
    if (payErr) {
      toast.error('فشل السداد: ' + payErr.message);
      return false;
    }

    // 2) توزيع المبلغ على المديونيات (الأقدم أولاً)
    const { data: openDebts } = await supabase
      .from('app_debts')
      .select('id, amount')
      .eq('customer_id', customerId)
      .eq('status', 'open')
      .order('created_at', { ascending: true });

    if (openDebts?.length) {
      let remaining = Number(amount);
      for (const debt of openDebts) {
        if (remaining <= 0) break;
        const debtAmt = Number(debt.amount);
        if (debtAmt <= remaining) {
          await supabase
            .from('app_debts')
            .update({ status: 'paid' })
            .eq('id', debt.id);
          remaining -= debtAmt;
        } else {
          await supabase
            .from('app_debts')
            .update({ amount: debtAmt - remaining })
            .eq('id', debt.id);
          remaining = 0;
        }
      }
    }

    toast.success('✅ تم تسجيل السداد');
    return true;
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, payDebt, refetch: fetchPayments };
}