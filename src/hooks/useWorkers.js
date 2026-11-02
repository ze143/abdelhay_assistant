import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { nowISO } from '../lib/formatters';
import toast from 'react-hot-toast';

export function useWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_workers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('فشل تحميل العمال: ' + error.message);
      setWorkers([]);
    } else {
      setWorkers(data || []);
    }
    setLoading(false);
  }, []);

  const addWorker = async (name, hourlyRate) => {
    const { error } = await supabase.from('app_workers').insert([
      { name, hourly_rate: hourlyRate, created_at: nowISO() },
    ]);
    if (error) {
      toast.error('فشل الإضافة: ' + error.message);
      return false;
    }
    toast.success('✅ تم إضافة العامل');
    await fetchWorkers();
    return true;
  };

  const updateWorker = async (id, updates) => {
    const { error } = await supabase
      .from('app_workers')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error('فشل التعديل: ' + error.message);
      return false;
    }
    toast.success('✅ تم التعديل');
    await fetchWorkers();
    return true;
  };

  const deleteWorker = async (id) => {
    const { error } = await supabase.from('app_workers').delete().eq('id', id);
    if (error) {
      toast.error('فشل الحذف: ' + error.message);
      return false;
    }
    toast.success('🗑️ تم حذف العامل');
    await fetchWorkers();
    return true;
  };

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return {
    workers,
    loading,
    addWorker,
    updateWorker,
    deleteWorker,
    refetch: fetchWorkers,
  };
}