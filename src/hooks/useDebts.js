import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { nowISO } from '../lib/formatters';
import toast from 'react-hot-toast';

export function useDebts() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDebts = useCallback(async (customerId = null) => {
    setLoading(true);
    let query = supabase
      .from('app_debts')
      .select('*, app_customers(name, phone)')
      .order('created_at', { ascending: false });
    if (customerId) query = query.eq('customer_id', customerId);
    const { data, error } = await query;
    if (error) {
      toast.error('فشل تحميل المديونيات: ' + error.message);
      setDebts([]);
    } else {
      setDebts(data || []);
    }
    setLoading(false);
    return data || [];
  }, []);

  const addDebt = async ({ customerId, amount, note }) => {
    const { error } = await supabase.from('app_debts').insert([
      {
        customer_id: customerId,
        amount,
        note,
        status: 'open',
        created_at: nowISO(),
      },
    ]);
    if (error) {
      toast.error('فشل الإضافة: ' + error.message);
      return false;
    }
    toast.success('✅ تم إضافة المديونية');
    return true;
  };

  const deleteDebt = async (id) => {
    const { error } = await supabase.from('app_debts').delete().eq('id', id);
    if (error) {
      toast.error('فشل الحذف: ' + error.message);
      return false;
    }
    toast.success('🗑️ تم الحذف');
    return true;
  };

  const sumForCustomer = useCallback(async (customerId) => {
    const { data, error } = await supabase
      .from('app_debts')
      .select('amount, status')
      .eq('customer_id', customerId)
      .eq('status', 'open');
    if (error) return 0;
    return (data || []).reduce((s, d) => s + Number(d.amount || 0), 0);
  }, []);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  return {
    debts,
    loading,
    addDebt,
    deleteDebt,
    sumForCustomer,
    refetch: fetchDebts,
  };
}