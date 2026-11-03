import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/formatters';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAlerts } from '../hooks/useAlerts';

const quickLinks = [
  { to: '/customers', title: 'العملاء', icon: 'fa-users', color: 'bg-sky-100 text-sky-600' },
  { to: '/debts', title: 'المديونيات', icon: 'fa-file-invoice', color: 'bg-red-100 text-red-600' },
  { to: '/workers', title: 'العمال', icon: 'fa-hard-hat', color: 'bg-primary-100 text-primary-600' },
  { to: '/inventory', title: 'المخزون', icon: 'fa-boxes', color: 'bg-purple-100 text-purple-600' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    openDebts: 0,
    paidDebts: 0,
    customersCount: 0,
    workersCount: 0,
    pendingBonus: 0,
    pendingDiscount: 0,
    pendingAdvance: 0,
    closingsCount: 0,
    productsCount: 0,
    inventoryValue: 0,
    supplierDebts: 0,
  });
  const [loading, setLoading] = useState(true);

  const { lowStock, supplierDebts, customerDebts, pendingTransactions } =
    useAlerts();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [
          debtsRes,
          custRes,
          workRes,
          txnsRes,
          closingsRes,
          prodRes,
          supRes,
          supPayRes,
        ] = await Promise.all([
          supabase.from('app_debts').select('amount, status'),
          supabase
            .from('app_customers')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('app_workers')
            .select('id', { count: 'exact', head: true }),
          supabase.from('app_transactions').select('type, amount'),
          supabase
            .from('app_closings')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('inv_products')
            .select('current_stock, avg_purchase_price')
            .eq('is_disabled', false),
          supabase.from('inv_supplies').select('supplier_id, total_amount'),
          supabase.from('inv_supplier_payments').select('supplier_id, amount'),
        ]);

        const allDebts = debtsRes.data || [];
        const openDebts = allDebts
          .filter((d) => d.status === 'open')
          .reduce((s, d) => s + Number(d.amount || 0), 0);
        const paidDebts = allDebts
          .filter((d) => d.status === 'paid')
          .reduce((s, d) => s + Number(d.amount || 0), 0);

        let bonus = 0,
          discount = 0,
          advance = 0;
        (txnsRes.data || []).forEach((t) => {
          const amt = Number(t.amount) || 0;
          if (t.type === 'مكافأة') bonus += amt;
          if (t.type === 'خصم') discount += amt;
          if (t.type === 'سلفة') advance += amt;
        });

        // حساب المخزون
        const prodList = prodRes.data || [];
        const inventoryValue = prodList.reduce(
          (s, p) =>
            s + Number(p.current_stock) * Number(p.avg_purchase_price || 0),
          0
        );

        // ديون الموردين
        const purchasesMap = {};
        (supRes.data || []).forEach((s) => {
          if (!s.supplier_id) return;
          purchasesMap[s.supplier_id] =
            (purchasesMap[s.supplier_id] || 0) + Number(s.total_amount || 0);
        });
        const paymentsMap = {};
        (supPayRes.data || []).forEach((p) => {
          paymentsMap[p.supplier_id] =
            (paymentsMap[p.supplier_id] || 0) + Number(p.amount || 0);
        });
        const supplierDebtsTotal = Object.keys(purchasesMap).reduce(
          (s, id) =>
            s +
            Math.max(0, (purchasesMap[id] || 0) - (paymentsMap[id] || 0)),
          0
        );

        setStats({
          openDebts,
          paidDebts,
          customersCount: custRes.count || 0,
          workersCount: workRes.count || 0,
          pendingBonus: bonus,
          pendingDiscount: discount,
          pendingAdvance: advance,
          closingsCount: closingsRes.count || 0,
          productsCount: prodList.length,
          inventoryValue,
          supplierDebts: supplierDebtsTotal,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  const pendingNet =
    stats.pendingBonus - stats.pendingDiscount - stats.pendingAdvance;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-600 flex items-center gap-3">
          <i className="fas fa-utensils" />
          مطعم عبدالحي الكبابجي
        </h1>
        <p className="text-slate-500 mt-1">لوحة التحكم الرئيسية</p>
      </div>

      {/* تنبيهات ذكية */}
      {(lowStock.length > 0 ||
        supplierDebts.length > 0 ||
        pendingTransactions > 0) && (
        <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded-xl mb-6">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-amber-800">
            <i className="fas fa-bell" />
            تنبيهات عاجلة
          </h3>
          <div className="space-y-2">
            {lowStock.length > 0 && (
              <Link
                to="/inventory"
                className="flex items-center justify-between bg-white rounded-lg p-2 hover:bg-slate-50"
              >
                <span className="text-sm">
                  <i className="fas fa-exclamation-triangle text-red-500 ml-1" />
                  <strong>{lowStock.length}</strong> صنف تحتاج توريد
                </span>
                <i className="fas fa-chevron-left text-xs text-slate-400" />
              </Link>
            )}
            {supplierDebts.length > 0 && (
              <Link
                to="/inventory/accounts"
                className="flex items-center justify-between bg-white rounded-lg p-2 hover:bg-slate-50"
              >
                <span className="text-sm">
                  <i className="fas fa-hand-holding-usd text-amber-500 ml-1" />
                  <strong>{supplierDebts.length}</strong> مورد عليه مديونية
                </span>
                <i className="fas fa-chevron-left text-xs text-slate-400" />
              </Link>
            )}
            {pendingTransactions > 0 && (
              <Link
                to="/workers"
                className="flex items-center justify-between bg-white rounded-lg p-2 hover:bg-slate-50"
              >
                <span className="text-sm">
                  <i className="fas fa-clock text-sky-500 ml-1" />
                  <strong>{pendingTransactions}</strong> حركة عمال معلقة
                </span>
                <i className="fas fa-chevron-left text-xs text-slate-400" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
          <p className="text-xs text-slate-500 mb-1">مديونيات العملاء</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(stats.openDebts)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.customersCount} عميل
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-primary-600">
          <p className="text-xs text-slate-500 mb-1">مستحقات العمال</p>
          <p className="text-xl font-bold text-primary-600">
            {formatCurrency(pendingNet)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.workersCount} عامل
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
          <p className="text-xs text-slate-500 mb-1">قيمة المخزون</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(stats.inventoryValue)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.productsCount} صنف
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-amber-500">
          <p className="text-xs text-slate-500 mb-1">ديون الموردين</p>
          <p className="text-xl font-bold text-amber-600">
            {formatCurrency(stats.supplierDebts)}
          </p>
          <p className="text-xs text-slate-400 mt-1">مستحقة الدفع</p>
        </div>
      </div>

      {/* وصول سريع */}
      <div className="bg-white rounded-2xl p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-bolt text-amber-500" />
          وصول سريع
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`${l.color} rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition`}
            >
              <i className={`fas ${l.icon} text-2xl`} />
              <span className="font-semibold text-sm">{l.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ملخص العملاء */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-chart-line text-sky-600" />
            ملخص العملاء
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-red-50 rounded-lg">
              <span className="text-slate-600">إجمالي المديونيات</span>
              <strong className="text-red-600">
                {formatCurrency(stats.openDebts)}
              </strong>
            </div>
            <div className="flex justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-slate-600">إجمالي المسدد</span>
              <strong className="text-green-600">
                {formatCurrency(stats.paidDebts)}
              </strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
              <span className="text-slate-600">عدد العملاء</span>
              <strong className="text-sky-600">{stats.customersCount}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <i className="fas fa-chart-line text-primary-600" />
            ملخص العمال
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-slate-600">مكافآت معلقة</span>
              <strong className="text-green-600">
                +{stats.pendingBonus.toFixed(2)}
              </strong>
            </div>
            <div className="flex justify-between p-2 bg-red-50 rounded-lg">
              <span className="text-slate-600">خصومات + سلف</span>
              <strong className="text-red-600">
                -{(stats.pendingDiscount + stats.pendingAdvance).toFixed(2)}
              </strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
              <span className="text-slate-600">التقفيلات المسجلة</span>
              <strong className="text-primary-600">{stats.closingsCount}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}