import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { nowISO } from '../lib/formatters';
import toast from 'react-hot-toast';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async (workerId = null) => {
    setLoading(true);
    let query = supabase
      .from('app_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (workerId) {
      query = query.eq('worker_id', workerId);
    }
    const { data, error } = await query;
    if (error) {
      toast.error('فشل تحميل الحركات: ' + error.message);
      setTransactions([]);
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
    return data || [];
  }, []);

  const addTransaction = async ({ workerId, type, amount, note }) => {
    const { error } = await supabase.from('app_transactions').insert([
      {
        worker_id: workerId,
        type,
        amount,
        note,
        created_at: nowISO(),
      },
    ]);
    if (error) {
      toast.error('فشل التسجيل: ' + error.message);
      return false;
    }
    toast.success('✅ تم التسجيل');
    return true;
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase
      .from('app_transactions')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('فشل الحذف: ' + error.message);
      return false;
    }
    toast.success('🗑️ تم الحذف');
    return true;
  };

  /**
   * يحسب إجمالي المكافآت/الخصومات/السلف لعامل معين
   */
 const sumForWorker = useCallback(async (workerId) => {
  const { data, error } = await supabase
    .from('app_transactions')
    .select('type, amount')
    .eq('worker_id', workerId)
    .is('closing_id', null);   // ← بس اللي لسه مش متقفل
  if (error) return { bonus: 0, discount: 0, advance: 0, net: 0 };
  let bonus = 0,
    discount = 0,
    advance = 0;
  (data || []).forEach((t) => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'مكافأة') bonus += amt;
    if (t.type === 'خصم') discount += amt;
    if (t.type === 'سلفة') advance += amt;
  });
  return {
    bonus,
    discount,
    advance,
    net: bonus - discount - advance,
  };
}, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    sumForWorker,
    refetch: fetchTransactions,
  };
}