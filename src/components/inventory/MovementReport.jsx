import { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { useProducts } from '../../hooks/inventory/useProducts';
import { formatDate, formatTime, toISODate } from '../../lib/formatters';
import { printInventoryReport } from '../../lib/printInventoryReport';

export default function MovementReport() {
  const { products } = useProducts();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: toISODate(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ),
    dateTo: toISODate(new Date()),
    productId: '',
    type: '',
  });

  const loadMovements = async () => {
    setLoading(true);
    let query = supabase
      .from('inv_stock_movements')
      .select('*, inv_products(name, unit)')
      .order('created_at', { ascending: false });

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
    if (filters.productId) {
      query = query.eq('product_id', Number(filters.productId));
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data } = await query;
    setMovements(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    let inQty = 0,
      outQty = 0;
    movements.forEach((m) => {
      if (m.type === 'توريد' || m.type === 'تحويل_داخل') {
        inQty += Number(m.quantity);
      } else if (m.type === 'سحب' || m.type === 'تحويل_خارج') {
        outQty += Number(m.quantity);
      }
    });
    return { inQty, outQty, count: movements.length };
  }, [movements]);

  const handlePrint = () => {
    if (movements.length === 0) {
      alert('لا توجد بيانات للطباعة');
      return;
    }
    const headers = ['#', 'التاريخ', 'الوقت', 'الصنف', 'النوع', 'الكمية', 'قبل', 'بعد', 'ملاحظات'];
    const rows = movements.map((m, i) => {
      const qty = Number(m.quantity);
      const typeLabel =
        m.type === 'توريد'
          ? '⬆️ توريد'
          : m.type === 'سحب'
          ? '⬇️ سحب'
          : m.type === 'تحويل_داخل'
          ? '🔄 داخل'
          : m.type === 'تحويل_خارج'
          ? '🔄 خارج'
          : m.type;
      return [
        i + 1,
        formatDate(m.created_at),
        formatTime(m.created_at),
        m.inv_products?.name || '—',
        typeLabel,
        qty.toFixed(2),
        Number(m.stock_before).toFixed(2),
        Number(m.stock_after).toFixed(2),
        m.notes || '—',
      ];
    });
    printInventoryReport({
      title: 'تقرير حركة المخزون',
      subtitle: `من ${formatDate(filters.dateFrom)} إلى ${formatDate(filters.dateTo)}`,
      headers,
      rows,
      footer: ['الإجمالي', '', '', '', '', `${totals.count} حركة`, '', '', ''],
      logoUrl: `${window.location.origin}/Asset-2.ico`,
    });
  };

  return (
    <Card
      title={`حركة المخزون (${totals.count})`}
      icon="fa-exchange-alt"
      action={
        <Button variant="info" icon="fa-print" onClick={handlePrint}>
          طباعة
        </Button>
      }
    >
      {/* فلاتر */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4 bg-slate-50 p-3 rounded-xl">
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
        <Select
          label="الصنف"
          value={filters.productId}
          onChange={(e) =>
            setFilters({ ...filters, productId: e.target.value })
          }
        >
          <option value="">كل الأصناف</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select
          label="النوع"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">كل الأنواع</option>
          <option value="توريد">توريد</option>
          <option value="سحب">سحب</option>
          <option value="تحويل_داخل">تحويل داخل</option>
          <option value="تحويل_خارج">تحويل خارج</option>
        </Select>
        <div className="flex items-end">
          <Button icon="fa-filter" onClick={loadMovements} fullWidth>
            تطبيق
          </Button>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">إجمالي الداخل</p>
          <p className="text-lg font-bold text-green-600">
            +{totals.inQty.toFixed(2)}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">إجمالي الخارج</p>
          <p className="text-lg font-bold text-red-600">
            -{totals.outQty.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">عدد الحركات</p>
          <p className="text-lg font-bold text-slate-700">{totals.count}</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : movements.length === 0 ? (
        <EmptyState icon="fa-exchange-alt" message="لا توجد حركات في الفترة المحددة" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="py-2 px-2 text-center text-xs">التاريخ</th>
                <th className="py-2 px-2 text-center text-xs">الوقت</th>
                <th className="py-2 px-2 text-center text-xs">الصنف</th>
                <th className="py-2 px-2 text-center text-xs">النوع</th>
                <th className="py-2 px-2 text-center text-xs">الكمية</th>
                <th className="py-2 px-2 text-center text-xs">قبل</th>
                <th className="py-2 px-2 text-center text-xs">بعد</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const isIn = m.type === 'توريد' || m.type === 'تحويل_داخل';
                return (
                  <tr key={m.id} className="border-b border-slate-50">
                    <td className="py-2 px-2 text-center text-xs">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-slate-500">
                      {formatTime(m.created_at)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs font-semibold">
                      {m.inv_products?.name || '—'}
                    </td>
                    <td className="py-2 px-2 text-center text-xs">
                      {m.type}
                    </td>
                    <td
                      className={`py-2 px-2 text-center text-xs font-bold ${
                        isIn ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isIn ? '+' : '-'}
                      {Number(m.quantity).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-amber-600">
                      {Number(m.stock_before).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center text-xs text-green-600">
                      {Number(m.stock_after).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}