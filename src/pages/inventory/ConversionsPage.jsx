import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import { useProducts } from '../../hooks/inventory/useProducts';
import { supabase } from '../../lib/supabase';
import { formatDate, formatCurrency, toISODate } from '../../lib/formatters';
import toast from 'react-hot-toast';

export default function ConversionsPage() {
  const { products, refetch: refetchProducts } = useProducts();
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    sourceProductId: '',
    targetProductId: '',
    targetQuantity: '',
    conversionFactor: '',
    conversionDate: toISODate(new Date()),
    notes: '',
  });

  const loadConversions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inv_conversions')
      .select('*')
      .order('created_at', { ascending: false });
    setConversions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadConversions();
  }, []);

  // حساب الكمية المصدر
  const sourceQty = useMemo(() => {
    const target = parseFloat(form.targetQuantity) || 0;
    const factor = parseFloat(form.conversionFactor) || 1;
    return factor > 0 ? target / factor : 0;
  }, [form.targetQuantity, form.conversionFactor]);

  const sourceProduct = products.find(
    (p) => p.id === Number(form.sourceProductId)
  );
  const targetProduct = products.find(
    (p) => p.id === Number(form.targetProductId)
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return conversions;
    const s = search.toLowerCase();
    return conversions.filter((c) => {
      const src = products.find((p) => p.id === c.source_product_id);
      const tgt = products.find((p) => p.id === c.target_product_id);
      return (
        (src?.name || '').toLowerCase().includes(s) ||
        (tgt?.name || '').toLowerCase().includes(s)
      );
    });
  }, [conversions, search, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sourceProductId || !form.targetProductId) {
      toast.error('اختر المنتجين');
      return;
    }
    if (form.sourceProductId === form.targetProductId) {
      toast.error('لا يمكن التحويل لنفس المنتج');
      return;
    }
    const targetQty = parseFloat(form.targetQuantity);
    const factor = parseFloat(form.conversionFactor);
    if (isNaN(targetQty) || targetQty <= 0) {
      toast.error('أدخل كمية صحيحة');
      return;
    }
    if (isNaN(factor) || factor <= 0) {
      toast.error('أدخل معامل تحويل صحيح');
      return;
    }
    if (sourceQty > Number(sourceProduct?.current_stock || 0)) {
      toast.error(
        `الكمية المصدر (${sourceQty.toFixed(2)}) أكبر من المتوفر (${Number(sourceProduct?.current_stock || 0).toFixed(2)})`
      );
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.rpc('add_conversion', {
      p_source_product_id: Number(form.sourceProductId),
      p_target_product_id: Number(form.targetProductId),
      p_source_quantity: sourceQty,
      p_target_quantity: targetQty,
      p_conversion_factor: factor,
      p_conversion_date: form.conversionDate,
      p_notes: form.notes.trim() || 'تحويل/تصنيع داخلي',
    });
    setSubmitting(false);

    if (error) {
      toast.error('فشل التحويل: ' + error.message);
      return;
    }

    toast.success('✅ تم التحويل بنجاح');
    setForm({
      sourceProductId: '',
      targetProductId: '',
      targetQuantity: '',
      conversionFactor: '',
      conversionDate: toISODate(new Date()),
      notes: '',
    });
    await refetchProducts();
    await loadConversions();
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-exchange-alt" />
        التحويلات والتصنيع
      </h1>

      {/* فورم التحويل */}
      <Card title="تحويل / تصنيع جديد" icon="fa-exchange-alt">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              label="المنتج المصدر (اللي هيخرج)"
              value={form.sourceProductId}
              onChange={(e) =>
                setForm({ ...form, sourceProductId: e.target.value })
              }
              required
            >
              <option value="">-- اختر المنتج --</option>
              {products
                .filter((p) => !p.is_disabled)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit}) — متوفر: {Number(p.current_stock).toFixed(2)}
                  </option>
                ))}
            </Select>
            <Select
              label="المنتج الهدف (اللي هيدخل)"
              value={form.targetProductId}
              onChange={(e) =>
                setForm({ ...form, targetProductId: e.target.value })
              }
              required
            >
              <option value="">-- اختر المنتج --</option>
              {products
                .filter((p) => !p.is_disabled)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit}) — متوفر: {Number(p.current_stock).toFixed(2)}
                  </option>
                ))}
            </Select>
            <Input
              label="كمية الهدف"
              type="number"
              step="0.01"
              min="0"
              value={form.targetQuantity}
              onChange={(e) =>
                setForm({ ...form, targetQuantity: e.target.value })
              }
              placeholder="0"
              required
            />
            <Input
              label="معامل التحويل (1 مصدر = ؟ هدف)"
              type="number"
              step="0.01"
              min="0"
              value={form.conversionFactor}
              onChange={(e) =>
                setForm({ ...form, conversionFactor: e.target.value })
              }
              placeholder="مثال: 0.8"
              required
            />
            <Input
              label="تاريخ التحويل"
              type="date"
              value={form.conversionDate}
              onChange={(e) =>
                setForm({ ...form, conversionDate: e.target.value })
              }
            />
            <Input
              label="ملاحظات (اختياري)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="تحويل/تصنيع"
            />
          </div>

          {sourceProduct && targetProduct && sourceQty > 0 && (
            <div className="bg-sky-50 border-r-4 border-sky-500 p-4 rounded-xl mb-4 text-sm">
              <p className="font-bold text-sky-800 mb-2">📊 ملخص العملية:</p>
              <div className="space-y-1">
                <p>
                  🧮 سحب: <strong>{sourceQty.toFixed(2)}</strong>{' '}
                  {sourceProduct.unit} من <strong>{sourceProduct.name}</strong>
                </p>
                <p>
                  🎯 إضافة: <strong>{form.targetQuantity}</strong>{' '}
                  {targetProduct.unit} إلى <strong>{targetProduct.name}</strong>
                </p>
                <p>
                  ⚖️ نسبة التحويل: 1 {sourceProduct.unit} ={' '}
                  {form.conversionFactor} {targetProduct.unit}
                </p>
                {sourceQty > Number(sourceProduct.current_stock) ? (
                  <p className="text-red-600 font-bold">
                    ⚠️ الكمية المطلوبة أكبر من المتوفر!
                  </p>
                ) : (
                  <p className="text-green-600 font-bold">
                    ✅ الكمية متوفرة
                  </p>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            icon="fa-sync-alt"
            loading={submitting}
            variant="info"
          >
            تنفيذ التحويل
          </Button>
        </form>
      </Card>

      {/* البحث */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ابحث بالمنتج..."
        />
      </div>

      {/* الجدول */}
      <Card title={`سجل التحويلات (${filtered.length})`} icon="fa-history">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="fa-exchange-alt" message="لا توجد تحويلات" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-2 text-center text-xs">التاريخ</th>
                  <th className="py-3 px-2 text-center text-xs">من</th>
                  <th className="py-3 px-2 text-center text-xs">الكمية</th>
                  <th className="py-3 px-2 text-center text-xs">إلى</th>
                  <th className="py-3 px-2 text-center text-xs">الكمية</th>
                  <th className="py-3 px-2 text-center text-xs">معامل</th>
                  <th className="py-3 px-2 text-center text-xs">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const src = products.find((p) => p.id === c.source_product_id);
                  const tgt = products.find((p) => p.id === c.target_product_id);
                  return (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-2 text-center text-xs">
                        {formatDate(c.conversion_date)}
                      </td>
                      <td className="py-2 px-2 text-center text-xs">
                        {src?.name || '—'}
                      </td>
                      <td className="py-2 px-2 text-center text-xs font-bold text-red-600">
                        -{Number(c.source_quantity).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center text-xs">
                        {tgt?.name || '—'}
                      </td>
                      <td className="py-2 px-2 text-center text-xs font-bold text-green-600">
                        +{Number(c.target_quantity).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center text-xs">
                        1:{c.conversion_factor}
                      </td>
                      <td className="py-2 px-2 text-center text-xs text-slate-500">
                        {c.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}