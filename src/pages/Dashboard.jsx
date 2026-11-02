import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/formatters';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const quickLinks = [
  { to: '/customers', title: 'العملاء', icon: 'fa-users', color: 'bg-sky-100 text-sky-600' },
  { to: '/debts', title: 'المديونيات', icon: 'fa-file-invoice', color: 'bg-red-100 text-red-600' },
  { to: '/workers', title: 'العمال', icon: 'fa-hard-hat', color: 'bg-primary-100 text-primary-600' },
  { to: '/closings', title: 'التقفيلات', icon: 'fa-archive', color: 'bg-purple-100 text-purple-600' },
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [debtsRes, custRes, workRes, txnsRes, closingsRes] = await Promise.all([
        supabase.from('app_debts').select('amount, status'),
        supabase.from('app_customers').select('id', { count: 'exact', head: true }),
        supabase.from('app_workers').select('id', { count: 'exact', head: true }),
        supabase.from('app_transactions').select('type, amount'),
        supabase.from('app_closings').select('id', { count: 'exact', head: true }),
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

      setStats({
        openDebts,
        paidDebts,
        customersCount: custRes.count || 0,
        workersCount: workRes.count || 0,
        pendingBonus: bonus,
        pendingDiscount: discount,
        pendingAdvance: advance,
        closingsCount: closingsRes.count || 0,
      });
      setLoading(false);
    })();
  }, []);

  const pendingNet = stats.pendingBonus - stats.pendingDiscount - stats.pendingAdvance;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-600 flex items-center gap-3">
          <i className="fas fa-utensils" />
          مطعم عبدالحي الكبابجي
        </h1>
        <p className="text-slate-500 mt-1">نظرة عامة على النشاط</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* إحصائيات العملاء */}
          <div className="mb-2 text-sm font-bold text-slate-500 flex items-center gap-2">
            <i className="fas fa-users text-sky-500" />
            العملاء
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
              <p className="text-xs text-slate-500 mb-1">إجمالي المديونيات المفتوحة</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.openDebts)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
              <p className="text-xs text-slate-500 mb-1">إجمالي المسدد</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.paidDebts)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border-r-4 border-sky-500">
              <p className="text-xs text-slate-500 mb-1">عدد العملاء</p>
              <p className="text-2xl font-bold text-sky-600">{stats.customersCount}</p>
            </div>
          </div>

          {/* إحصائيات العمال */}
          <div className="mb-2 text-sm font-bold text-slate-500 flex items-center gap-2">
            <i className="fas fa-hard-hat text-primary-600" />
            العمال
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 border-r-4 border-primary-600">
              <p className="text-xs text-slate-500 mb-1">عدد العمال</p>
              <p className="text-2xl font-bold text-primary-600">{stats.workersCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
              <p className="text-xs text-slate-500 mb-1">مكافآت معلقة</p>
              <p className="text-2xl font-bold text-green-600">
                +{stats.pendingBonus.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
              <p className="text-xs text-slate-500 mb-1">خصومات + سلف معلقة</p>
              <p className="text-2xl font-bold text-red-600">
                -{(stats.pendingDiscount + stats.pendingAdvance).toFixed(2)}
              </p>
            </div>
            <div
              className={`bg-white rounded-2xl p-5 border-r-4 ${
                pendingNet >= 0 ? 'border-amber-500' : 'border-red-600'
              }`}
            >
              <p className="text-xs text-slate-500 mb-1">صافي المستحقات المعلقة</p>
              <p
                className={`text-2xl font-bold ${
                  pendingNet >= 0 ? 'text-amber-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(pendingNet)}
              </p>
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

          {/* معلومات إضافية */}
          <div className="bg-white rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-chart-simple text-primary-600" />
              ملخص عام
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">عدد التقفيلات المسجلة</span>
                <strong className="text-primary-600">{stats.closingsCount}</strong>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">إجمالي الحركات المعلقة</span>
                <strong className="text-amber-600">
                  {stats.pendingBonus + stats.pendingDiscount + stats.pendingAdvance} عمليات
                </strong>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">إجمالي التعاملات مع العملاء</span>
                <strong className="text-sky-600">
                  {formatCurrency(stats.openDebts + stats.paidDebts)}
                </strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}