import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatDate } from '../../lib/formatters';

export default function InventoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [suppliersAccounts, setSuppliersAccounts] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [recentSupplies, setRecentSupplies] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pRes, sRes, supRes, payRes, wRes, supListRes] = await Promise.all([
          supabase.from('inv_products').select('*').eq('is_disabled', false),
          supabase
            .from('inv_supplies')
            .select('*, inv_products(name, unit), inv_suppliers(name)')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('inv_supplies').select('supplier_id, total_amount'),
          supabase.from('inv_supplier_payments').select('supplier_id, amount'),
          supabase
            .from('inv_withdrawals')
            .select('*, inv_products(name, unit)')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('inv_suppliers').select('*').eq('is_active', true),
        ]);

        setProducts(pRes.data || []);
        setRecentSupplies(sRes.data || []);
        setRecentWithdrawals(wRes.data || []);

        // حسابات الموردين
        const suppliersList = supListRes.data || [];
        const purchasesMap = {};
        (sRes.data || []).forEach(() => {}); // placeholder
        (supRes.data || []).forEach((s) => {
          if (!s.supplier_id) return;
          purchasesMap[s.supplier_id] =
            (purchasesMap[s.supplier_id] || 0) + Number(s.total_amount || 0);
        });
        const paymentsMap = {};
        (payRes.data || []).forEach((p) => {
          paymentsMap[p.supplier_id] =
            (paymentsMap[p.supplier_id] || 0) + Number(p.amount || 0);
        });

        const accounts = suppliersList
          .map((s) => {
            const purchases = purchasesMap[s.id] || 0;
            const paid = paymentsMap[s.id] || 0;
            const remaining = purchases - paid;
            return { ...s, purchases, paid, remaining };
          })
          .filter((s) => s.purchases > 0 || s.paid > 0);

        setSuppliersAccounts(accounts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // إحصائيات
  const stats = useMemo(() => {
    const lowStock = products.filter(
      (p) => Number(p.current_stock) <= Number(p.min_threshold)
    );
    const totalValue = products.reduce(
      (s, p) => s + Number(p.current_stock) * Number(p.avg_purchase_price || 0),
      0
    );
    const totalDebts = suppliersAccounts.reduce(
      (s, a) => s + (a.remaining > 0 ? a.remaining : 0),
      0
    );
    const totalPaid = suppliersAccounts.reduce((s, a) => s + a.paid, 0);
    const totalPurchases = suppliersAccounts.reduce((s, a) => s + a.purchases, 0);

    return {
      productCount: products.length,
      lowStockCount: lowStock.length,
      totalValue,
      totalDebts,
      totalPaid,
      totalPurchases,
    };
  }, [products, suppliersAccounts]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-600 flex items-center gap-3">
          <i className="fas fa-chart-line" />
          لوحة تحكم المخزون
        </h1>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-primary-600">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <i className="fas fa-boxes" /> عدد الأصناف
          </p>
          <p className="text-2xl font-bold text-primary-600">
            {stats.productCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <i className="fas fa-exclamation-triangle" /> أصناف قليلة
          </p>
          <p className="text-2xl font-bold text-red-600">
            {stats.lowStockCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <i className="fas fa-coins" /> قيمة المخزون
          </p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-amber-500">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <i className="fas fa-hand-holding-usd" /> ديون الموردين
          </p>
          <p className="text-2xl font-bold text-amber-600">
            {formatCurrency(stats.totalDebts)}
          </p>
        </div>
      </div>

      {/* إحصائيات الموردين */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-sky-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المشتريات</p>
          <p className="text-2xl font-bold text-sky-600">
            {formatCurrency(stats.totalPurchases)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-emerald-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المدفوع للموردين</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(stats.totalPaid)}
          </p>
        </div>
      </div>

      {/* وصول سريع */}
      <div className="bg-white rounded-2xl p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-bolt text-amber-500" /> وصول سريع
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/inventory"
            className="bg-primary-100 text-primary-600 rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition"
          >
            <i className="fas fa-boxes text-2xl" />
            <span className="font-semibold text-sm">المخزون</span>
          </Link>
          <Link
            to="/inventory/supplies"
            className="bg-sky-100 text-sky-600 rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition"
          >
            <i className="fas fa-truck text-2xl" />
            <span className="font-semibold text-sm">توريد جديد</span>
          </Link>
          <Link
            to="/inventory/withdrawals"
            className="bg-red-100 text-red-600 rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition"
          >
            <i className="fas fa-download text-2xl" />
            <span className="font-semibold text-sm">سحب جديد</span>
          </Link>
          <Link
            to="/inventory/accounts"
            className="bg-green-100 text-green-600 rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition"
          >
            <i className="fas fa-hand-holding-usd text-2xl" />
            <span className="font-semibold text-sm">حسابات</span>
          </Link>
        </div>
      </div>

      {/* أصناف قليلة */}
      {stats.lowStockCount > 0 && (
        <Card title="⚠️ أصناف تحتاج توريد" icon="fa-exclamation-triangle">
          <div className="space-y-2">
            {products
              .filter(
                (p) => Number(p.current_stock) <= Number(p.min_threshold)
              )
              .slice(0, 10)
              .map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-red-50 rounded-xl p-3"
                >
                  <div>
                    <strong className="text-slate-800">{p.name}</strong>
                    <span className="text-xs text-slate-500 mr-2">
                      ({p.unit})
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-500">
                      الحد الأدنى: {Number(p.min_threshold).toFixed(2)}
                    </p>
                    <p className="font-bold text-red-600 text-sm">
                      المتوفر: {Number(p.current_stock).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* آخر التوريدات */}
      <Card title="آخر التوريدات" icon="fa-truck">
        {recentSupplies.length === 0 ? (
          <p className="text-center py-6 text-slate-400 text-sm">
            لا توجد توريدات
          </p>
        ) : (
          <div className="space-y-2">
            {recentSupplies.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-slate-50 rounded-xl p-3"
              >
                <div>
                  <strong className="text-sm">{s.inv_products?.name}</strong>
                  <span className="text-xs text-slate-500 mr-2">
                    من {s.inv_suppliers?.name || '—'}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-primary-600 text-sm">
                    +{Number(s.quantity).toFixed(2)} {s.inv_products?.unit}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(s.supply_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* آخر السحوبات */}
      <Card title="آخر السحوبات" icon="fa-download">
        {recentWithdrawals.length === 0 ? (
          <p className="text-center py-6 text-slate-400 text-sm">
            لا توجد سحوبات
          </p>
        ) : (
          <div className="space-y-2">
            {recentWithdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between bg-slate-50 rounded-xl p-3"
              >
                <div>
                  <strong className="text-sm">{w.inv_products?.name}</strong>
                </div>
                <div className="text-left">
                  <p className="font-bold text-red-600 text-sm">
                    -{Number(w.quantity).toFixed(2)} {w.inv_products?.unit}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(w.withdrawal_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}