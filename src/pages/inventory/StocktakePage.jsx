import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import { useProducts } from '../../hooks/inventory/useProducts';
import { supabase } from '../../lib/supabase';
import { formatDate, formatCurrency, toISODate } from '../../lib/formatters';
import toast from 'react-hot-toast';

export default function StocktakePage() {
  const { products, loading, refetch } = useProducts();
  const [search, setSearch] = useState('');
  const [counts, setCounts] = useState({});
  const [notes, setNotes] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return products.filter((p) => !p.is_disabled);
    const s = search.toLowerCase();
    return products
      .filter((p) => !p.is_disabled)
      .filter((p) => p.name.toLowerCase().includes(s));
  }, [products, search]);

  // الإحصائيات
  const stats = useMemo(() => {
    let changed = 0;
    let totalDiff = 0;
    filtered.forEach((p) => {
      const actual = parseFloat(counts[p.id]);
      if (!isNaN(actual)) {
        const diff = actual - Number(p.current_stock);
        if (Math.abs(diff) > 0.001) {
          changed++;
          totalDiff += diff;
        }
      }
    });
    return { changed, totalDiff };
  }, [filtered, counts]);

  const handleCountChange = (productId, value) => {
    setCounts({ ...counts, [productId]: value });
  };

  const handleApplyStocktake = async () => {
    if (stats.changed === 0) {
      toast.error('مفيش فرق في الجرد — عدّل الكميات الأول');
      return;
    }

    setSubmitting(true);

    try {
      const today = toISODate(new Date());
      let applied = 0;
      let errors = [];

      for (const p of filtered) {
        const actual = parseFloat(counts[p.id]);
        if (isNaN(actual)) continue;

        const diff = actual - Number(p.current_stock);
        if (Math.abs(diff) < 0.001) continue;

        // 1. تحديث المخزون
        const { error: updErr } = await supabase
          .from('inv_products')
          .update({ current_stock: actual })
          .eq('id', p.id);

        if (updErr) {
          errors.push(`${p.name}: ${updErr.message}`);
          continue;
        }

        // 2. تسجيل حركة تسوية
        const { error: movErr } = await supabase
          .from('inv_stock_movements')
          .insert([
            {
              product_id: p.id,
              type: 'تسوية',
              quantity: diff,
              stock_before: Number(p.current_stock),
              stock_after: actual,
              reference_table: 'stocktake',
              notes: notes[p.id] || `تسوية جرد ${today}`,
            },
          ]);

        if (movErr) {
          console.error('Movement error:', movErr);
        }

        applied++;
      }

      setSubmitting(false);

      if (errors.length > 0) {
        toast.error(`تم تطبيق ${applied} تسوية. أخطاء: ${errors.length}`);
      } else {
        toast.success(`✅ تم تطبيق ${applied} تسوية بنجاح`);
      }

      setCounts({});
      setNotes({});
      await refetch();
    } catch (e) {
      setSubmitting(false);
      toast.error('فشل التطبيق: ' + e.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-clipboard-check" />
        الجرد الدوري
      </h1>

      <div className="bg-sky-50 border-r-4 border-sky-500 p-4 rounded-xl mb-6 text-sm">
        <i className="fas fa-info-circle text-sky-600 ml-1" />
        <strong>ملاحظة:</strong> أدخل الكمية الفعلية في خانة "الكمية الفعلية".
        أي فرق سيتم تسجيله كـ "تسوية مخزون".
      </div>

      {/* البحث */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ابحث باسم الصنف..."
        />
      </div>

      {/* الإحصائيات */}
      {stats.changed > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border-r-4 border-amber-500">
            <p className="text-xs text-slate-500 mb-1">أصناف معدّلة</p>
            <p className="text-2xl font-bold text-amber-600">{stats.changed}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border-r-4 border-primary-600">
            <p className="text-xs text-slate-500 mb-1">إجمالي الفرق</p>
            <p className="text-2xl font-bold text-primary-600">
              {stats.totalDiff.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* الجدول */}
      <Card
        title={`الأصناف (${filtered.length})`}
        icon="fa-clipboard-check"
        action={
          <Button
            variant="success"
            icon="fa-check"
            onClick={handleApplyStocktake}
            loading={submitting}
            disabled={stats.changed === 0}
          >
            تطبيق الجرد ({stats.changed})
          </Button>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon="fa-boxes" message="لا توجد أصناف" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-2 text-center text-xs">الصنف</th>
                  <th className="py-3 px-2 text-center text-xs">الوحدة</th>
                  <th className="py-3 px-2 text-center text-xs">
                    الكمية بالنظام
                  </th>
                  <th className="py-3 px-2 text-center text-xs">
                    الكمية الفعلية
                  </th>
                  <th className="py-3 px-2 text-center text-xs">الفرق</th>
                  <th className="py-3 px-2 text-center text-xs">القيمة</th>
                  <th className="py-3 px-2 text-center text-xs">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const actual = parseFloat(counts[p.id]);
                  const diff = isNaN(actual)
                    ? null
                    : actual - Number(p.current_stock);
                  const hasDiff = diff !== null && Math.abs(diff) > 0.001;
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-50 ${
                        hasDiff ? 'bg-amber-50' : ''
                      }`}
                    >
                      <td className="py-2 px-2 text-center text-sm font-semibold">
                        {p.name}
                      </td>
                      <td className="py-2 px-2 text-center text-xs text-slate-500">
                        {p.unit}
                      </td>
                      <td className="py-2 px-2 text-center text-sm font-bold text-primary-600">
                        {Number(p.current_stock).toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={counts[p.id] || ''}
                          onChange={(e) =>
                            handleCountChange(p.id, e.target.value)
                          }
                          placeholder="—"
                          className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                      </td>
                      <td
                        className={`py-2 px-2 text-center text-sm font-bold ${
                          hasDiff
                            ? diff > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {diff !== null
                          ? (diff > 0 ? '+' : '') + diff.toFixed(2)
                          : '—'}
                      </td>
                      <td className="py-2 px-2 text-center text-xs">
                        {hasDiff
                          ? formatCurrency(
                              Math.abs(diff) * Number(p.avg_purchase_price || 0)
                            )
                          : '—'}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="text"
                          value={notes[p.id] || ''}
                          onChange={(e) =>
                            setNotes({ ...notes, [p.id]: e.target.value })
                          }
                          placeholder="سبب الفرق"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
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