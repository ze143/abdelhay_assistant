import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { formatDate, formatTime, formatCurrency } from '../../lib/formatters';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('app_payments')
        .select('*, app_customers(name, phone)')
        .order('created_at', { ascending: false });
      setPayments(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const s = search.toLowerCase();
    return payments.filter((p) => {
      const name = p.app_customers?.name || '';
      return name.toLowerCase().includes(s);
    });
  }, [payments, search]);

  const total = filtered.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-money-bill-wave" />
        سجل المدفوعات
      </h1>

      {/* الإحصائيات — بس إجمالي + عدد */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المدفوعات</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-sky-500">
          <p className="text-xs text-slate-500 mb-1">عدد الدفعات</p>
          <p className="text-2xl font-bold text-sky-600">{filtered.length}</p>
        </div>
      </div>

      {/* البحث */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ابحث باسم العميل..."
        />
        {search && (
          <p className="text-xs text-slate-500 mt-2">
            نتائج البحث: <strong>{filtered.length}</strong> دفعة —{' '}
            <strong>{formatCurrency(total)}</strong>
          </p>
        )}
      </div>

      {/* الجدول */}
      <Card title={`كل الدفعات (${filtered.length})`} icon="fa-list">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="fa-money-bill-wave" message="لا توجد مدفوعات" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-3 text-center text-sm">#</th>
                  <th className="py-3 px-3 text-center text-sm">العميل</th>
                  <th className="py-3 px-3 text-center text-sm">المبلغ</th>
                  <th className="py-3 px-3 text-center text-sm">التاريخ</th>
                  <th className="py-3 px-3 text-center text-sm">الوقت</th>
                  <th className="py-3 px-3 text-center text-sm">ملاحظة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3 text-center text-sm">{i + 1}</td>
                    <td className="py-2 px-3 text-center text-sm font-semibold">
                      <Link
                        to={`/customers/${p.customer_id}`}
                        className="text-primary-600 hover:underline"
                      >
                        {p.app_customers?.name || '—'}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-bold text-green-600">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-2 px-3 text-center text-sm">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {formatTime(p.created_at)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {p.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-green-50 font-bold">
                  <td colSpan="2" className="py-3 px-3 text-center text-sm">
                    الإجمالي
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-green-700">
                    {formatCurrency(total)}
                  </td>
                  <td colSpan="3" className="py-3 px-3 text-center text-xs text-slate-600">
                    {filtered.length} دفعة
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}