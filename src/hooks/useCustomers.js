import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { nowISO } from '../lib/formatters';
import toast from 'react-hot-toast';

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('فشل تحميل العملاء: ' + error.message);
      setCustomers([]);
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  }, []);

  const addCustomer = async (name, phone) => {
    const { error } = await supabase.from('app_customers').insert([
      { name, phone, created_at: nowISO() },
    ]);
    if (error) {
      toast.error('فشل الإضافة: ' + error.message);
      return false;
    }
    toast.success('✅ تم إضافة العميل');
    await fetchCustomers();
    return true;
  };

  const updateCustomer = async (id, updates) => {
    const { error } = await supabase
      .from('app_customers')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error('فشل التعديل: ' + error.message);
      return false;
    }
    toast.success('✅ تم التعديل');
    await fetchCustomers();
    return true;
  };

  const deleteCustomer = async (id) => {
    const { error } = await supabase
      .from('app_customers')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('فشل الحذف: ' + error.message);
      return false;
    }
    toast.success('🗑️ تم حذف العميل');
    await fetchCustomers();
    return true;
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
}