import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function useSupplies() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSupplies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inv_supplies')
      .select('*, inv_suppliers(name), inv_products(name, unit)')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('فشل تحميل التوريدات: ' + error.message);
      setSupplies([]);
    } else {
      setSupplies(data || []);
    }
    setLoading(false);
  }, []);

  const addSupply = async ({
    supplierId,
    productId,
    quantity,
    unitPrice,
    supplyDate,
    notes,
    invoiceNumber,
  }) => {
    // استخدام RPC للعملية الذرية
    const { error } = await supabase.rpc('add_supply', {
      p_supplier_id: supplierId || null,
      p_product_id: productId,
      p_quantity: quantity,
      p_unit_price: unitPrice,
      p_supply_date: supplyDate,
      p_notes: notes,
      p_invoice_number: invoiceNumber,
    });

    if (error) {
      toast.error('فشل التوريد: ' + error.message);
      return false;
    }
    toast.success('✅ تم تسجيل التوريد');
    await fetchSupplies();
    return true;
  };

  const deleteSupply = async (id) => {
    // حذف التوريد — مع إرجاع الكمية
    const supply = supplies.find((s) => s.id === id);
    if (!supply) return false;

    // جلب المنتج
    const { data: product } = await supabase
      .from('inv_products')
      .select('current_stock')
      .eq('id', supply.product_id)
      .single();

    if (!product) return false;

    // رجّع المخزون
    const newStock = product.current_stock - supply.quantity;
    if (newStock < 0) {
      toast.error('لا يمكن الحذف — المخزون أقل من الكمية');
      return false;
    }

    await supabase
      .from('inv_products')
      .update({ current_stock: newStock })
      .eq('id', supply.product_id);

    const { error } = await supabase
      .from('inv_supplies')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('فشل الحذف: ' + error.message);
      return false;
    }
    toast.success('🗑️ تم حذف التوريد');
    await fetchSupplies();
    return true;
  };

  useEffect(() => {
    fetchSupplies();
  }, [fetchSupplies]);

  return {
    supplies,
    loading,
    addSupply,
    deleteSupply,
    refetch: fetchSupplies,
  };
}