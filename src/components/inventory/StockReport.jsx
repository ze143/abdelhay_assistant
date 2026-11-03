import { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { useProducts } from '../../hooks/inventory/useProducts';
import { formatCurrency } from '../../lib/formatters';
import { printInventoryReport } from '../../lib/printInventoryReport';

export default function StockReport() {
  const { products, loading } = useProducts();
  const [showOnlyLow, setShowOnlyLow] = useState(false);

  const filtered = useMemo(() => {
    let list = products.filter((p) => !p.is_disabled);
    if (showOnlyLow) {
      list = list.filter(
        (p) => Number(p.current_stock) <= Number(p.min_threshold)
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, showOnlyLow]);

  const totals = useMemo(() => {
    const totalItems = filtered.length;
    const totalValue = filtered.reduce(
      (s, p) =>
        s + Number(p.current_stock) * Number(p.avg_purchase_price || 0),
      0
    );
    return { totalItems, totalValue };
  }, [filtered]);

  const handlePrint = () => {
    if (filtered.length === 0) {
      alert('لا توجد بيانات للطباعة');
      return;
    }
    const headers = [
      '#',
      'الصنف',
      'الوحدة',
      'الكمية',
      'الحد الأدنى',
      'متوسط السعر',
      'القيمة',
      'الحالة',
    ];
    const rows = filtered.map((p, i) => {
      const low = Number(p.current_stock) <= Number(p.min_threshold);
      return [
        i + 1,
        p.name,
        p.unit,
        Number(p.current_stock).toFixed(2),
        Number(p.min_threshold).toFixed(2),
        formatCurrency(p.avg_purchase_price),
        formatCurrency(
          Number(p.current_stock) * Number(p.avg_purchase_price || 0)
        ),
        low ? '⚠️ قليل' : '✅ جيد',
      ];
    });
    const footer = [
      'الإجمالي',
      '',
      '',
      '',
      '',
      '',
      formatCurrency(totals.totalValue),
      `${totals.totalItems} صنف`,
    ];
    printInventoryReport({
      title: 'تقرير المخزون الحالي',
      subtitle: showOnlyLow ? 'الأصناف القليلة فقط' : 'كل الأصناف',
      headers,
      rows,
      footer,
      logoUrl: `${window.location.origin}/Asset-2.ico`,
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Card
      title={`تقرير المخزون (${filtered.length})`}
      icon="fa-boxes"
      action={
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="info"
            icon="fa-print"
            onClick={handlePrint}
          >
            طباعة
          </Button>
        </div>
      }
    >
      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-primary-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">عدد الأصناف</p>
          <p className="text-xl font-bold text-primary-600">{totals.totalItems}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">قيمة المخزون</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(totals.totalValue)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center flex items-center justify-center">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={showOnlyLow}
              onChange={(e) => setShowOnlyLow(e.target.checked)}
              className="w-4 h-4"
            />
            القليلة فقط
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="fa-boxes" message="لا توجد أصناف" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="py-2 px-2 text-center text-xs">#</th>
                <th className="py-2 px-2 text-center text-xs">الصنف</th>
                <th className="py-2 px-2 text-center text-xs">الوحدة</th>
                <th className="py-2 px-2 text-center text-xs">الكمية</th>
                <th className="py-2 px-2 text-center text-xs">الحد الأدنى</th>
                <th className="py-2 px-2 text-center text-xs">متوسط السعر</th>
                <th className="py-2 px-2 text-center text-xs">القيمة</th>
                <th className="py-2 px-2 text-center text-xs">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const low = Number(p.current_stock) <= Number(p.min_threshold);
                return (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2 px-2 text-center text-xs">{i + 1}</td>
                    <td className="py-2 px-2 text-center text-xs font-semibold">
                      {p.name}
                    </td>
                    <td className="py-2 px-2 text-center text-xs">{p.unit}</td>
                    <td
                      className={`py-2 px-2 text-center text-xs font-bold ${
                        low ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {Number(p.current_stock).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs">
                      {Number(p.min_threshold).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs">
                      {formatCurrency(p.avg_purchase_price)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs font-bold text-primary-600">
                      {formatCurrency(
                        Number(p.current_stock) *
                          Number(p.avg_purchase_price || 0)
                      )}
                    </td>
                    <td className="py-2 px-2 text-center text-xs">
                      {low ? '⚠️ قليل' : '✅'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-primary-50 font-bold">
                <td colSpan="6" className="py-2 px-2 text-center text-xs">
                  الإجمالي
                </td>
                <td className="py-2 px-2 text-center text-xs text-primary-700">
                  {formatCurrency(totals.totalValue)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}