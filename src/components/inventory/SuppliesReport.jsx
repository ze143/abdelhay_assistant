import { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { useSuppliers } from '../../hooks/inventory/useSuppliers';
import { formatDate, formatCurrency, toISODate } from '../../lib/formatters';
import { printInventoryReport } from '../../lib/printInventoryReport';

export default function SuppliesReport() {
  const { suppliers } = useSuppliers();
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: toISODate(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    ),
    dateTo: toISODate(new Date()),
    supplierId: '',
  });

  const loadSupplies = async () => {
    setLoading(true);
    let query = supabase
      .from('inv_supplies')
      .select('*, inv_products(name, unit), inv_suppliers(name)')
      .order('supply_date', { ascending: false });

    if (filters.dateFrom) {
      query = query.gte('supply_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('supply_date', filters.dateTo);
    }
    if (filters.supplierId) {
      query = query.eq('supplier_id', Number(filters.supplierId));
    }

    const { data } = await query;
    setSupplies(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSupplies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    return supplies.reduce(
      (acc, s) => ({
        amount: acc.amount + Number(s.total_amount || 0),
        count: acc.count + 1,
      }),
      { amount: 0, count: 0 }
    );
  }, [supplies]);

  // تجميع حسب المورد
  const bySupplier = useMemo(() => {
    const map = {};
    supplies.forEach((s) => {
      const key = s.supplier_id || 'none';
      if (!map[key]) {
        map[key] = {
          name: s.inv_suppliers?.name || 'بدون مورد',
          amount: 0,
          count: 0,
        };
      }
      map[key].amount += Number(s.total_amount || 0);
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [supplies]);

  const handlePrint = () => {
    if (supplies.length === 0) {
      alert('لا توجد بيانات للطباعة');
      return;
    }
    const headers = ['#', 'التاريخ', 'المورد', 'الصنف', 'الكمية', 'سعر الوحدة', 'الإجمالي'];
    const rows = supplies.map((s, i) => [
      i + 1,
      formatDate(s.supply_date),
      s.inv_suppliers?.name || '—',
      s.inv_products?.name || '—',
      Number(s.quantity).toFixed(2),
      formatCurrency(s.unit_price),
      formatCurrency(s.total_amount),
    ]);
    printInventoryReport({
      title: 'تقرير التوريدات',
      subtitle: `من ${formatDate(filters.dateFrom)} إلى ${formatDate(filters.dateTo)}`,
      headers,
      rows,
      footer: [
        'الإجمالي',
        '',
        '',
        '',
        '',
        `${totals.count} توريد`,
        formatCurrency(totals.amount),
      ],
      logoUrl: `${window.location.origin}/Asset-2.ico`,
    });
  };

  return (
    <>
      <Card
        title={`التوريدات (${totals.count})`}
        icon="fa-truck"
        action={
          <Button variant="info" icon="fa-print" onClick={handlePrint}>
            طباعة
          </Button>
        }
      >
        {/* فلاتر */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 bg-slate-50 p-3 rounded-xl">
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
            onChange={(e) =>
              setFilters({ ...filters, dateTo: e.target.value })
            }
          />
          <Select
            label="المورد"
            value={filters.supplierId}
            onChange={(e) =>
              setFilters({ ...filters, supplierId: e.target.value })
            }
          >
            <option value="">كل الموردين</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <div className="flex items-end">
            <Button icon="fa-filter" onClick={loadSupplies} fullWidth>
              تطبيق
            </Button>
          </div>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-primary-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">عدد التوريدات</p>
            <p className="text-xl font-bold text-primary-600">{totals.count}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 mb-1">إجمالي المشتريات</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(totals.amount)}
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : supplies.length === 0 ? (
          <EmptyState icon="fa-truck" message="لا توجد توريدات في الفترة المحددة" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-2 px-2 text-center text-xs">التاريخ</th>
                  <th className="py-2 px-2 text-center text-xs">المورد</th>
                  <th className="py-2 px-2 text-center text-xs">الصنف</th>
                  <th className="py-2 px-2 text-center text-xs">الكمية</th>
                  <th className="py-2 px-2 text-center text-xs">سعر</th>
                  <th className="py-2 px-2 text-center text-xs">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {supplies.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ملخص الموردين */}
      <Card title="ملخص المشتريات من الموردين" icon="fa-users">
        {bySupplier.length === 0 ? (
          <EmptyState icon="fa-users" message="لا توجد بيانات" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-2 px-3 text-center text-xs">#</th>
                  <th className="py-2 px-3 text-center text-xs">المورد</th>
                  <th className="py-2 px-3 text-center text-xs">عدد التوريدات</th>
                  <th className="py-2 px-3 text-center text-xs">إجمالي المشتريات</th>
                </tr>
              </thead>
              <tbody>
                {bySupplier.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 px-3 text-center text-sm">{i + 1}</td>
                    <td className="py-2 px-3 text-center text-sm font-semibold">
                      {s.name}
                    </td>
                    <td className="py-2 px-3 text-center text-sm">{s.count}</td>
                    <td className="py-2 px-3 text-center text-sm font-bold text-primary-600">
                      {formatCurrency(s.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}