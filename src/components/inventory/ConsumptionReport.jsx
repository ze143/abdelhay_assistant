import { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { formatDate, toISODate } from '../../lib/formatters';
import { printInventoryReport } from '../../lib/printInventoryReport';

export default function ConsumptionReport() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: toISODate(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ),
    dateTo: toISODate(new Date()),
  });

  const loadWithdrawals = async () => {
    setLoading(true);
    let query = supabase
      .from('inv_withdrawals')
      .select('*, inv_products(name, unit)');

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      query = query.gte('created_at', from.toISOString());
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      query = query.lte('created_at', to.toISOString());
    }

    const { data } = await query;
    setWithdrawals(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تجميع حسب الصنف
  const byProduct = useMemo(() => {
    const map = {};
    withdrawals.forEach((w) => {
      const key = w.product_id;
      if (!map[key]) {
        map[key] = {
          productId: key,
          name: w.inv_products?.name || '—',
          unit: w.inv_products?.unit || '',
          totalQty: 0,
          count: 0,
        };
      }
      map[key].totalQty += Number(w.quantity);
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.totalQty - a.totalQty);
  }, [withdrawals]);

  const handlePrint = () => {
    if (byProduct.length === 0) {
      alert('لا توجد بيانات للطباعة');
      return;
    }
    const headers = ['#', 'الصنف', 'الوحدة', 'إجمالي الكمية المسحوبة', 'عدد مرات السحب'];
    const rows = byProduct.map((p, i) => [
      i + 1,
      p.name,
      p.unit,
      p.totalQty.toFixed(2),
      p.count,
    ]);
    printInventoryReport({
      title: 'تقرير الاستهلاك',
      subtitle: `من ${formatDate(filters.dateFrom)} إلى ${formatDate(filters.dateTo)}`,
      headers,
      rows,
      footer: ['الإجمالي', '', '', `${byProduct.length} صنف`, ''],
      logoUrl: `${window.location.origin}/Asset-2.ico`,
    });
  };

  return (
    <Card
      title={`تقرير الاستهلاك (${byProduct.length} صنف)`}
      icon="fa-fire"
      action={
        <Button variant="info" icon="fa-print" onClick={handlePrint}>
          طباعة
        </Button>
      }
    >
      {/* فلاتر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 bg-slate-50 p-3 rounded-xl">
        <Input
          label="من تاريخ"
          type="date"
          value={filters.dateFrom}
          onChange={(e) =>
            setFilters({ ...filters, dateFrom: e.target.value })
          }
        />
        <Input
          label="إلى تاريخ"
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
        />
        <div className="flex items-end">
          <Button icon="fa-filter" onClick={loadWithdrawals} fullWidth>
            تطبيق
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : byProduct.length === 0 ? (
        <EmptyState icon="fa-fire" message="لا توجد سحوبات في الفترة المحددة" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="py-2 px-3 text-center text-xs">#</th>
                <th className="py-2 px-3 text-center text-xs">الصنف</th>
                <th className="py-2 px-3 text-center text-xs">الوحدة</th>
                <th className="py-2 px-3 text-center text-xs">إجمالي الكمية</th>
                <th className="py-2 px-3 text-center text-xs">عدد المرات</th>
                <th className="py-2 px-3 text-center text-xs">متوسط كل مرة</th>
              </tr>
            </thead>
            <tbody>
              {byProduct.map((p, i) => (
                <tr key={p.productId} className="border-b border-slate-50">
                  <td className="py-2 px-3 text-center text-sm">{i + 1}</td>
                  <td className="py-2 px-3 text-center text-sm font-semibold">
                    {p.name}
                  </td>
                  <td className="py-2 px-3 text-center text-xs text-slate-500">
                    {p.unit}
                  </td>
                  <td className="py-2 px-3 text-center text-sm font-bold text-red-600">
                    {p.totalQty.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-center text-sm">{p.count}</td>
                  <td className="py-2 px-3 text-center text-sm text-amber-600">
                    {(p.totalQty / p.count).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}