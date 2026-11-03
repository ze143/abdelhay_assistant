import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import { useProducts } from '../../hooks/inventory/useProducts';
import { formatCurrency } from '../../lib/formatters';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const { products, loading, addProduct, updateProduct, deleteProduct } = useProducts();
  const [search, setSearch] = useState('');
  const [showDisabled, setShowDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // إضافة
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    unit: '',
    minThreshold: '',
    maxThreshold: '',
  });

  // تعديل
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({});

  // حذف
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // الفلترة
  const filtered = useMemo(() => {
    let list = products;
    if (!showDisabled) list = list.filter((p) => !p.is_disabled);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(s));
    }
    // ترتيب: الكمية القليلة الأول
    return list.sort((a, b) => {
      if (a.is_disabled && !b.is_disabled) return 1;
      if (!a.is_disabled && b.is_disabled) return -1;
      const aLow = !a.is_disabled && Number(a.current_stock) <= Number(a.min_threshold);
      const bLow = !b.is_disabled && Number(b.current_stock) <= Number(b.min_threshold);
      if (aLow && !bLow) return -1;
      if (!aLow && bLow) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [products, search, showDisabled]);

  // الإحصائيات
  const stats = useMemo(() => {
    const active = products.filter((p) => !p.is_disabled);
    const lowStock = active.filter(
      (p) => Number(p.current_stock) <= Number(p.min_threshold)
    );
    const totalValue = active.reduce(
      (s, p) => s + Number(p.current_stock) * Number(p.avg_purchase_price || 0),
      0
    );
    return {
      total: active.length,
      lowStock: lowStock.length,
      totalValue,
    };
  }, [products]);

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.unit.trim()) {
      toast.error('أدخل الاسم والوحدة');
      return;
    }
    setSubmitting(true);
    const ok = await addProduct({
      name: addForm.name.trim(),
      unit: addForm.unit.trim(),
      minThreshold: parseFloat(addForm.minThreshold) || 0,
      maxThreshold: parseFloat(addForm.maxThreshold) || null,
    });
    setSubmitting(false);
    if (ok) {
      setAddModal(false);
      setAddForm({ name: '', unit: '', minThreshold: '', maxThreshold: '' });
    }
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setEditForm({
      name: p.name,
      unit: p.unit,
      min_threshold: p.min_threshold,
      max_threshold: p.max_threshold || '',
      is_disabled: p.is_disabled,
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim() || !editForm.unit.trim()) {
      toast.error('أدخل الاسم والوحدة');
      return;
    }
    setSubmitting(true);
    await updateProduct(editProduct.id, {
      name: editForm.name.trim(),
      unit: editForm.unit.trim(),
      min_threshold: parseFloat(editForm.min_threshold) || 0,
      max_threshold: parseFloat(editForm.max_threshold) || null,
      is_disabled: editForm.is_disabled,
    });
    setSubmitting(false);
    setEditProduct(null);
  };

  const handleDelete = async () => {
    setSubmitting(true);
    await deleteProduct(deleteConfirm.id);
    setSubmitting(false);
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-600 flex items-center gap-3">
          <i className="fas fa-boxes" />
          المخزون
        </h1>
        <Button icon="fa-plus" onClick={() => setAddModal(true)}>
          إضافة صنف
        </Button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-primary-600">
          <p className="text-xs text-slate-500 mb-1">عدد الأصناف</p>
          <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
          <p className="text-xs text-slate-500 mb-1">أصناف قليلة</p>
          <p className="text-2xl font-bold text-red-600">{stats.lowStock}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
          <p className="text-xs text-slate-500 mb-1">قيمة المخزون</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>
      </div>

      {/* البحث والفلتر */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="ابحث باسم الصنف..."
          />
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={showDisabled}
              onChange={(e) => setShowDisabled(e.target.checked)}
              className="w-4 h-4"
            />
            إظهار الأصناف المشطوبة
          </label>
        </div>
      </div>

      {/* الجدول */}
      <Card title={`الأصناف (${filtered.length})`} icon="fa-list">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="fa-boxes" message="لا توجد أصناف" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-3 text-center text-sm">#</th>
                  <th className="py-3 px-3 text-center text-sm">الصنف</th>
                  <th className="py-3 px-3 text-center text-sm">الوحدة</th>
                  <th className="py-3 px-3 text-center text-sm">الكمية</th>
                  <th className="py-3 px-3 text-center text-sm">الحد الأدنى</th>
                  <th className="py-3 px-3 text-center text-sm">متوسط السعر</th>
                  <th className="py-3 px-3 text-center text-sm">القيمة</th>
                  <th className="py-3 px-3 text-center text-sm">الحالة</th>
                  <th className="py-3 px-3 text-center text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const low =
                    !p.is_disabled &&
                    Number(p.current_stock) <= Number(p.min_threshold);
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-50 hover:bg-slate-50 ${
                        p.is_disabled ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-sm">{i + 1}</td>
                      <td className="py-2 px-3 text-center text-sm font-semibold">
                        {p.name}
                      </td>
                      <td className="py-2 px-3 text-center text-xs text-slate-500">
                        {p.unit}
                      </td>
                      <td
                        className={`py-2 px-3 text-center text-sm font-bold ${
                          low ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {Number(p.current_stock).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center text-sm text-slate-500">
                        {Number(p.min_threshold).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center text-sm">
                        {formatCurrency(p.avg_purchase_price)}
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-semibold text-primary-600">
                        {formatCurrency(
                          Number(p.current_stock) * Number(p.avg_purchase_price || 0)
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {p.is_disabled ? (
                          <span className="inline-block px-2 py-1 rounded-full text-xs bg-slate-200 text-slate-600">
                            مشطوب
                          </span>
                        ) : low ? (
                          <span className="inline-block px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                            ⚠️ قليل
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            ✅ جيد
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
                            title="تعديل"
                          >
                            <i className="fas fa-edit text-xs" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p)}
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                            title="حذف"
                          >
                            <i className="fas fa-trash-alt text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* مودال إضافة */}
      <Modal
        open={addModal}
        title="إضافة صنف جديد"
        icon="fa-plus-circle"
        onClose={() => setAddModal(false)}
      >
        <div className="space-y-3">
          <Input
            label="اسم الصنف"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            placeholder="مثال: لحمة"
            required
          />
          <Input
            label="الوحدة"
            value={addForm.unit}
            onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
            placeholder="كيلو / قطعة / لتر"
            required
          />
          <Input
            label="الحد الأدنى للتنبيه"
            type="number"
            step="0.01"
            value={addForm.minThreshold}
            onChange={(e) =>
              setAddForm({ ...addForm, minThreshold: e.target.value })
            }
            placeholder="0"
          />
          <Input
            label="الحد الأقصى (اختياري)"
            type="number"
            step="0.01"
            value={addForm.maxThreshold}
            onChange={(e) =>
              setAddForm({ ...addForm, maxThreshold: e.target.value })
            }
            placeholder="اتركه فاضي لو مش محتاجه"
          />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button variant="secondary" onClick={() => setAddModal(false)} disabled={submitting}>
            إلغاء
          </Button>
          <Button onClick={handleAdd} loading={submitting}>
            إضافة
          </Button>
        </div>
      </Modal>

      {/* مودال تعديل */}
      <Modal
        open={!!editProduct}
        title="تعديل الصنف"
        icon="fa-edit"
        onClose={() => setEditProduct(null)}
      >
        <div className="space-y-3">
          <Input
            label="اسم الصنف"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label="الوحدة"
            value={editForm.unit || ''}
            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
          />
          <Input
            label="الحد الأدنى"
            type="number"
            step="0.01"
            value={editForm.min_threshold || ''}
            onChange={(e) =>
              setEditForm({ ...editForm, min_threshold: e.target.value })
            }
          />
          <Input
            label="الحد الأقصى (اختياري)"
            type="number"
            step="0.01"
            value={editForm.max_threshold || ''}
            onChange={(e) =>
              setEditForm({ ...editForm, max_threshold: e.target.value })
            }
          />
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={editForm.is_disabled || false}
              onChange={(e) =>
                setEditForm({ ...editForm, is_disabled: e.target.checked })
              }
              className="w-4 h-4"
            />
            صنف مشطوب
          </label>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button
            variant="secondary"
            onClick={() => setEditProduct(null)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button onClick={handleSaveEdit} loading={submitting}>
            حفظ
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="تأكيد الحذف"
        message={`حذف الصنف "${deleteConfirm?.name}"؟ سيتم حذف كل حركاته.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={submitting}
      />
    </div>
  );
}