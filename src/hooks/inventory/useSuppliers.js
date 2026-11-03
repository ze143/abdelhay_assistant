import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inv_suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) {
      toast.error('فشل تحميل الموردين: ' + error.message);
      setSuppliers([]);
    } else {
      setSuppliers(data || []);
    }
    setLoading(false);
  }, []);

  const addSupplier = async ({ name, contact, isFactory, paymentTerms, notes }) => {
    const { error } = await supabase.from('inv_suppliers').insert([
      {
        name,
        contact,
        is_factory: isFactory || false,
        payment_terms: paymentTerms || 'نقدي',
        notes,
      },
    ]);
    if (error) {
      toast.error('فشل الإضافة: ' + error.message);
      return false;
    }
    toast.success('✅ تم إضافة المورد');
    await fetchSuppliers();
    return true;
  };

  const updateSupplier = async (id, updates) => {
    const { error } = await supabase
      .from('inv_suppliers')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error('فشل التعديل: ' + error.message);
      return false;
    }
    toast.success('✅ تم التعديل');
    await fetchSuppliers();
    return true;
  };

  const deleteSupplier = async (id) => {
    const { error } = await supabase
      .from('inv_suppliers')
      .update({ is_active: false })
      .eq('id', id);
    if (error) {
      toast.error('فشل الحذف: ' + error.message);
      return false;
    }
    toast.success('🗑️ تم حذف المورد');
    await fetchSuppliers();
    return true;
  };

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers,
  };
}