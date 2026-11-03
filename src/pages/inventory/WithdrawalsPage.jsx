import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import { useWithdrawals } from '../../hooks/inventory/useWithdrawals';
import { useProducts } from '../../hooks/inventory/useProducts';
import { formatDate, formatTime, toISODate } from '../../lib/formatters';
import toast from 'react-hot-toast';

export default function WithdrawalsPage() {
  const { withdrawals, loading, addWithdrawal } = useWithdrawals();
  const { products, refetch: refetchProducts } = useProducts();

  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    productId: '',
    quantity: '',
    withdrawalDate: toISODate(new Date()),
    notes: '',
  });

  const selectedProduct = products.find(
    (p) => p.id === Number(form.productId)
  );
  const availableStock = selectedProduct
    ? Number(selectedProduct.current_stock)
    : 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return withdrawals;
    const s = search.toLowerCase();
    return withdrawals.filter((w) =>
      (w.inv_products?.name || '').toLowerCase().includes(s)
    );
  }, [withdrawals, search]);

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
    if (quantity > availableStock) {
      toast.error(`الكمية أكبر من المتوفر (${availableStock.toFixed(2)})`);
      return;
    }

    setSubmitting(true);
    const ok = await addWithdrawal({
      productId: Number(form.productId),
      quantity,
      withdrawalDate: form.withdrawalDate,
      notes: form.notes.trim(),
    });
    setSubmitting(false);

    if (ok) {
      setForm({
        productId: form.productId,
        quantity: '',
        withdrawalDate: toISODate(new Date()),
        notes: '',
      });
      await refetchProducts();
    }
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-download" />
        السحوبات
      </h1>

      {/* فورم السحب */}
      <Card title="تسجيل سحب من المخزن" icon="fa-minus-circle">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              label={`الكمية ${selectedProduct ? `(المتوفر: ${availableStock.toFixed(2)} ${selectedProduct.unit})` : ''}`}
              type="number"
              step="0.01"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="0"
              required
            />
            <Input
              label="تاريخ السحب"
              type="date"
              value={form.withdrawalDate}
              onChange={(e) =>
                setForm({ ...form, withdrawalDate: e.target.value })
              }
            />
          </div>

          <div className="mt-4">
            <Input
              label="ملاحظات (اختياري)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="سبب السحب"
            />
          </div>

          <Button
            type="submit"
            icon="fa-save"
            loading={submitting}
            className="mt-4"
            variant="danger"
          >
            تسجيل السحب
          </Button>
        </form>
      </Card>

      {/* البحث */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ابحث باسم المنتج..."
        />
      </div>

      {/* الجدول */}
      <Card title={`سجل السحوبات (${filtered.length})`} icon="fa-list">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="fa-download" message="لا توجد سحوبات" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-3 text-center text-sm">التاريخ</th>
                  <th className="py-3 px-3 text-center text-sm">المنتج</th>
                  <th className="py-3 px-3 text-center text-sm">الكمية</th>
                  <th className="py-3 px-3 text-center text-sm">قبل</th>
                  <th className="py-3 px-3 text-center text-sm">بعد</th>
                  <th className="py-3 px-3 text-center text-sm">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 text-center text-sm">
                      {formatDate(w.withdrawal_date)}
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-semibold">
                      {w.inv_products?.name || '—'}
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-bold text-red-600">
                      -{Number(w.quantity).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-amber-600">
                      {Number(w.stock_before).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-green-600">
                      {Number(w.stock_after).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {w.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}