import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { useSuppliers } from '../../hooks/inventory/useSuppliers';
import { useProducts } from '../../hooks/inventory/useProducts';
import toast from 'react-hot-toast';

export default function InventorySettingsPage() {
  const {
    suppliers,
    loading: loadingSup,
    addSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers();
  const {
    products,
    loading: loadingProd,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useProducts();

  const [submitting, setSubmitting] = useState(false);

  // مودال المورد
  const [supplierModal, setSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    isFactory: false,
    paymentTerms: 'نقدي',
    notes: '',
  });
  const [editSupplier, setEditSupplier] = useState(null);

  // مودال الصنف
  const [productModal, setProductModal] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    unit: '',
    minThreshold: '',
    maxThreshold: '',
  });
  const [editProduct, setEditProduct] = useState(null);

  // تأكيدات
  const [deleteSupConfirm, setDeleteSupConfirm] = useState(null);
  const [deleteProdConfirm, setDeleteProdConfirm] = useState(null);

  // الموردين
  const openAddSupplier = () => {
    setEditSupplier(null);
    setSupplierForm({
      name: '',
      contact: '',
      isFactory: false,
      paymentTerms: 'نقدي',
      notes: '',
    });
    setSupplierModal(true);
  };

  const openEditSupplier = (s) => {
    setEditSupplier(s);
    setSupplierForm({
      name: s.name,
      contact: s.contact || '',
      isFactory: s.is_factory,
      paymentTerms: s.payment_terms || 'نقدي',
      notes: s.notes || '',
    });
    setSupplierModal(true);
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast.error('أدخل اسم المورد');
      return;
    }
    setSubmitting(true);
    let ok;
    if (editSupplier) {
      ok = await updateSupplier(editSupplier.id, {
        name: supplierForm.name.trim(),
        contact: supplierForm.contact.trim(),
        is_factory: supplierForm.isFactory,
        payment_terms: supplierForm.paymentTerms,
        notes: supplierForm.notes.trim(),
      });
    } else {
      ok = await addSupplier({
        name: supplierForm.name.trim(),
        contact: supplierForm.contact.trim(),
        isFactory: supplierForm.isFactory,
        paymentTerms: supplierForm.paymentTerms,
        notes: supplierForm.notes.trim(),
      });
    }
    setSubmitting(false);
    if (ok) setSupplierModal(false);
  };

  const handleDeleteSupplier = async () => {
    setSubmitting(true);
    await deleteSupplier(deleteSupConfirm.id);
    setSubmitting(false);
    setDeleteSupConfirm(null);
  };

  // الأصناف
  const openAddProduct = () => {
    setEditProduct(null);
    setProductForm({
      name: '',
      unit: '',
      minThreshold: '',
      maxThreshold: '',
    });
    setProductModal(true);
  };

  const openEditProduct = (p) => {
    setEditProduct(p);
    setProductForm({
      name: p.name,
      unit: p.unit,
      minThreshold: p.min_threshold,
      maxThreshold: p.max_threshold || '',
    });
    setProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !productForm.unit.trim()) {
      toast.error('أدخل اسم الصنف والوحدة');
      return;
    }
    setSubmitting(true);
    let ok;
    if (editProduct) {
      ok = await updateProduct(editProduct.id, {
        name: productForm.name.trim(),
        unit: productForm.unit.trim(),
        min_threshold: parseFloat(productForm.minThreshold) || 0,
        max_threshold: parseFloat(productForm.maxThreshold) || null,
      });
    } else {
      ok = await addProduct({
        name: productForm.name.trim(),
        unit: productForm.unit.trim(),
        minThreshold: parseFloat(productForm.minThreshold) || 0,
        maxThreshold: parseFloat(productForm.maxThreshold) || null,
      });
    }
    setSubmitting(false);
    if (ok) setProductModal(false);
  };

  const handleDeleteProduct = async () => {
    setSubmitting(true);
    await deleteProduct(deleteProdConfirm.id);
    setSubmitting(false);
    setDeleteProdConfirm(null);
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-cog" />
        إعدادات المخزون والموردين
      </h1>

      {/* الموردين */}
      <Card
        title={`الموردين (${suppliers.length})`}
        icon="fa-truck"
        action={
          <Button icon="fa-plus" onClick={openAddSupplier} variant="primary">
            إضافة مورد
          </Button>
        }
      >
        {loadingSup ? (
          <LoadingSpinner />
        ) : suppliers.length === 0 ? (
          <EmptyState icon="fa-truck" message="لا يوجد موردين" />
        ) : (
          <div className="space-y-2">
            {suppliers.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-slate-50 rounded-xl p-3 hover:bg-slate-100"
              >
                <div className="flex-1">
                  <strong className="text-sm">{s.name}</strong>
                  {s.is_factory && (
                    <span className="text-xs text-amber-600 mr-2">(مصنع)</span>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {s.contact || '—'} · {s.payment_terms}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditSupplier(s)}
                    className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
                  >
                    <i className="fas fa-edit text-xs" />
                  </button>
                  <button
                    onClick={() => setDeleteSupConfirm(s)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <i className="fas fa-trash-alt text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* الأصناف */}
      <Card
        title={`الأصناف (${products.length})`}
        icon="fa-boxes"
        action={
          <Button icon="fa-plus" onClick={openAddProduct} variant="primary">
            إضافة صنف
          </Button>
        }
      >
        {loadingProd ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <EmptyState icon="fa-boxes" message="لا توجد أصناف" />
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-slate-50 rounded-xl p-3 hover:bg-slate-100"
              >
                <div className="flex-1">
                  <strong className="text-sm">
                    {p.name} <span className="text-xs text-slate-500">({p.unit})</span>
                  </strong>
                  {p.is_disabled && (
                    <span className="text-xs text-red-600 mr-2">مشطوب</span>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    حد أدنى: {Number(p.min_threshold).toFixed(2)} · المتوفر:{' '}
                    {Number(p.current_stock).toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditProduct(p)}
                    className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
                  >
                    <i className="fas fa-edit text-xs" />
                  </button>
                  <button
                    onClick={() => setDeleteProdConfirm(p)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <i className="fas fa-trash-alt text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* مودال المورد */}
      <Modal
        open={supplierModal}
        title={editSupplier ? 'تعديل المورد' : 'إضافة مورد جديد'}
        icon="fa-truck"
        onClose={() => setSupplierModal(false)}
      >
        <div className="space-y-3">
          <Input
            label="اسم المورد"
            value={supplierForm.name}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, name: e.target.value })
            }
            required
          />
          <Input
            label="رقم الهاتف"
            value={supplierForm.contact}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, contact: e.target.value })
            }
          />
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={supplierForm.isFactory}
              onChange={(e) =>
                setSupplierForm({
                  ...supplierForm,
                  isFactory: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            مورد مصنع (السعر تلقائي 0)
          </label>
          <Input
            label="شروط الدفع"
            value={supplierForm.paymentTerms}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })
            }
            placeholder="نقدي / آجل 30 يوم"
          />
          <Input
            label="ملاحظات"
            value={supplierForm.notes}
            onChange={(e) =>
              setSupplierForm({ ...supplierForm, notes: e.target.value })
            }
          />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button
            variant="secondary"
            onClick={() => setSupplierModal(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button onClick={handleSaveSupplier} loading={submitting}>
            حفظ
          </Button>
        </div>
      </Modal>

      {/* مودال الصنف */}
      <Modal
        open={productModal}
        title={editProduct ? 'تعديل الصنف' : 'إضافة صنف جديد'}
        icon="fa-boxes"
        onClose={() => setProductModal(false)}
      >
        <div className="space-y-3">
          <Input
            label="اسم الصنف"
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
            required
          />
          <Input
            label="الوحدة"
            value={productForm.unit}
            onChange={(e) =>
              setProductForm({ ...productForm, unit: e.target.value })
            }
            placeholder="كيلو / قطعة / لتر"
            required
          />
          <Input
            label="الحد الأدنى"
            type="number"
            step="0.01"
            value={productForm.minThreshold}
            onChange={(e) =>
              setProductForm({ ...productForm, minThreshold: e.target.value })
            }
          />
          <Input
            label="الحد الأقصى (اختياري)"
            type="number"
            step="0.01"
            value={productForm.maxThreshold}
            onChange={(e) =>
              setProductForm({ ...productForm, maxThreshold: e.target.value })
            }
          />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button
            variant="secondary"
            onClick={() => setProductModal(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button onClick={handleSaveProduct} loading={submitting}>
            حفظ
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteSupConfirm}
        title="تأكيد الحذف"
        message={`حذف المورد "${deleteSupConfirm?.name}"؟`}
        onConfirm={handleDeleteSupplier}
        onCancel={() => setDeleteSupConfirm(null)}
        loading={submitting}
      />

      <ConfirmDialog
        open={!!deleteProdConfirm}
        title="تأكيد الحذف"
        message={`حذف الصنف "${deleteProdConfirm?.name}"؟ سيتم حذف كل حركاته.`}
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteProdConfirm(null)}
        loading={submitting}
      />
    </div>
  );
}