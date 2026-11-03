import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inv_withdrawals')
      .select('*, inv_products(name, unit)')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('فشل تحميل السحوبات: ' + error.message);
      setWithdrawals([]);
    } else {
      setWithdrawals(data || []);
    }
    setLoading(false);
  }, []);

  const addWithdrawal = async ({ productId, quantity, withdrawalDate, notes }) => {
    const { error } = await supabase.rpc('add_withdrawal', {
      p_product_id: productId,
      p_quantity: quantity,
      p_withdrawal_date: withdrawalDate,
      p_notes: notes,
    });

    if (error) {
      toast.error('فشل السحب: ' + error.message);
      return false;
    }
    toast.success('✅ تم تسجيل السحب');
    await fetchWithdrawals();
    return true;
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  return {
    withdrawals,
    loading,
    addWithdrawal,
    refetch: fetchWithdrawals,
  };
}