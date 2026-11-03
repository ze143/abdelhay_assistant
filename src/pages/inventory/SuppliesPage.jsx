import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import { useSupplies } from '../../hooks/inventory/useSupplies';
import { useSuppliers } from '../../hooks/inventory/useSuppliers';
import { useProducts } from '../../hooks/inventory/useProducts';
import { formatDate, formatTime, formatCurrency, toISODate } from '../../lib/formatters';
import toast from 'react-hot-toast';

export default function SuppliesPage() {
  const { supplies, loading, addSupply } = useSupplies();
  const { suppliers } = useSuppliers();
  const { products, refetch: refetchProducts } = useProducts();

  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    supplierId: '',
    productId: '',
    quantity: '',
    unitPrice: '',
    invoiceNumber: '',
    supplyDate: toISODate(new Date()),
    notes: '',
  });

  // لو المورد مصنع → السعر 0
  const selectedSupplier = suppliers.find(
    (s) => s.id === Number(form.supplierId)
  );
  const isFactory = selectedSupplier?.is_factory || false;

  const filtered = useMemo(() => {
    if (!search.trim()) return supplies;
    const s = search.toLowerCase();
    return supplies.filter(
      (sup) =>
        (sup.inv_suppliers?.name || '').toLowerCase().includes(s) ||
        (sup.inv_products?.name || '').toLowerCase().includes(s) ||
        (sup.invoice_number || '').toLowerCase().includes(s)
    );
  }, [supplies, search]);

  const totalAmount = filtered.reduce(
    (s, sup) => s + Number(sup.total_amount || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.quantity) {
      toast.error('اختر منتج وأدخل الكمية');
      return;
    }
    const quantity = parseFloat(form.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('أدخل كمية صحيحة');
      return;
    }
    const unitPrice = isFactory ? 0 : parseFloat(form.unitPrice) || 0;

    setSubmitting(true);
    const ok = await addSupply({
      supplierId: form.supplierId ? Number(form.supplierId) : null,
      productId: Number(form.productId),
      quantity,
      unitPrice,
      supplyDate: form.supplyDate,
      notes: form.notes.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
    });
    setSubmitting(false);

    if (ok) {
      setForm({
        supplierId: form.supplierId,
        productId: '',
        quantity: '',
        unitPrice: '',
        invoiceNumber: '',
        supplyDate: toISODate(new Date()),
        notes: '',
      });
      await refetchProducts();
    }
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-truck" />
        التوريدات
      </h1>

      {/* فورم التوريد */}
      <Card title="تسجيل توريد جديد" icon="fa-plus-circle">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="المورد"
              value={form.supplierId}
              onChange={(e) =>
                setForm({ ...form, supplierId: e.target.value })
              }
            >
              <option value="">-- بدون مورد --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.is_factory ? ' (مصنع)' : ''}
                </option>
              ))}
            </Select>
            <Select
              label="المنتج"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              required
            >
              <option value="">-- اختر المنتج --</option>
              {products
                .filter((p) => !p.is_disabled)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit}) — المتوفر: {Number(p.current_stock).toFixed(2)}
                  </option>
                ))}
            </Select>
            <Input
              label="الكمية"
              type="number"
              step="0.01"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
              required
            />
            <Input
              label={isFactory ? 'سعر الوحدة (مصنع - تلقائي 0)' : 'سعر الوحدة'}
              type="number"
              step="0.01"
              min="0"
              value={isFactory ? 0 : form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              disabled={isFactory}
              placeholder="0"
            />
            <Input
              label="رقم الفاتورة (اختياري)"
              value={form.invoiceNumber}
              onChange={(e) =>
                setForm({ ...form, invoiceNumber: e.target.value })
              }
              placeholder="INV-2026-001"
            />
            <Input
              label="تاريخ التوريد"
              type="date"
              value={form.supplyDate}
              onChange={(e) => setForm({ ...form, supplyDate: e.target.value })}
            />
          </div>

          {form.quantity && (
            <div className="mt-3 bg-amber-50 rounded-xl p-3 text-sm">
              <strong>الإجمالي المتوقع:</strong>{' '}
              {formatCurrency(
                parseFloat(form.quantity || 0) *
                  (isFactory ? 0 : parseFloat(form.unitPrice || 0))
              )}
            </div>
          )}

          <div className="mt-4">
            <Input
              label="ملاحظات (اختياري)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="ملاحظات التوريد"
            />
          </div>

          <Button
            type="submit"
            icon="fa-save"
            loading={submitting}
            className="mt-4"
          >
            تسجيل التوريد
          </Button>
        </form>
      </Card>

      {/* البحث */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ابحث بالمورد أو المنتج أو رقم الفاتورة..."
        />
        {search && (
          <p className="text-xs text-slate-500 mt-2">
            نتائج البحث: <strong>{filtered.length}</strong> توريد —{' '}
            <strong>{formatCurrency(totalAmount)}</strong>
          </p>
        )}
      </div>

      {/* الجدول */}
      <Card title={`سجل التوريدات (${filtered.length})`} icon="fa-list">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="fa-truck" message="لا توجد توريدات" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-2 text-center text-xs">التاريخ</th>
                  <th className="py-3 px-2 text-center text-xs">المورد</th>
                  <th className="py-3 px-2 text-center text-xs">المنتج</th>
                  <th className="py-3 px-2 text-center text-xs">الكمية</th>
                  <th className="py-3 px-2 text-center text-xs">السعر</th>
                  <th className="py-3 px-2 text-center text-xs">الإجمالي</th>
                  <th className="py-3 px-2 text-center text-xs">فاتورة</th>
                  <th className="py-3 px-2 text-center text-xs">قبل</th>
                  <th className="py-3 px-2 text-center text-xs">بعد</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-2 text-center text-xs">
                      {formatDate(s.supply_date)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs font-semibold">
                      {s.inv_suppliers?.name || '—'}
                    </td>
                    <td className="py-2 px-2 text-center text-xs">
                      {s.inv_products?.name || '—'}
                    </td>
                    <td className="py-2 px-2 text-center text-xs">
                      {Number(s.quantity).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs">
                      {formatCurrency(s.unit_price)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs font-bold text-primary-600">
                      {formatCurrency(s.total_amount)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-slate-500">
                      {s.invoice_number || '—'}
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-amber-600">
                      {Number(s.stock_before).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-green-600">
                      {Number(s.stock_after).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary-50 font-bold">
                  <td colSpan="5" className="py-3 px-2 text-center text-sm">
                    الإجمالي
                  </td>
                  <td className="py-3 px-2 text-center text-sm text-primary-700">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td colSpan="3" className="py-3 px-2 text-center text-xs text-slate-600">
                    {filtered.length} توريد
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}