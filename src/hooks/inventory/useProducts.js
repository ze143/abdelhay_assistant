import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inv_products')
      .select('*')
      .order('name');
    if (error) {
      toast.error('فشل تحميل الأصناف: ' + error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, []);

  const addProduct = async ({ name, unit, minThreshold, maxThreshold, isDisabled }) => {
    const { error } = await supabase.from('inv_products').insert([
      {
        name,
        unit,
        min_threshold: minThreshold || 0,
        max_threshold: maxThreshold || null,
        is_disabled: isDisabled || false,
        current_stock: 0,
      },
    ]);
    if (error) {
      toast.error('فشل الإضافة: ' + error.message);
      return false;
    }
    toast.success('✅ تم إضافة الصنف');
    await fetchProducts();
    return true;
  };

  const updateProduct = async (id, updates) => {
    const { error } = await supabase
      .from('inv_products')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast.error('فشل التعديل: ' + error.message);
      return false;
    }
    toast.success('✅ تم التعديل');
    await fetchProducts();
    return true;
  };

  const deleteProduct = async (id) => {
    const { error } = await supabase
      .from('inv_products')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('فشل الحذف: ' + error.message);
      return false;
    }
    toast.success('🗑️ تم حذف الصنف');
    await fetchProducts();
    return true;
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts,
  };
}