import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import { supabase } from '../../lib/supabase';
import { formatDate, formatTime, formatCurrency } from '../../lib/formatters';

export default function AllDebtsPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('app_debts')
        .select('*, app_customers(name, phone)')
        .order('created_at', { ascending: false });
      setDebts(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return debts.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const name = d.app_customers?.name || '';
        if (!name.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [debts, search, statusFilter]);

  const totals = useMemo(() => {
    const open = filtered
      .filter((d) => d.status === 'open')
      .reduce((s, d) => s + Number(d.amount || 0), 0);
    const paid = filtered
      .filter((d) => d.status === 'paid')
      .reduce((s, d) => s + Number(d.amount || 0), 0);
    return { open, paid };
  }, [filtered]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-600 flex items-center gap-3">
          <i className="fas fa-file-invoice" />
          سجل المديونيات الكامل
        </h1>
        <Link
          to="/debts"
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2"
        >
          <i className="fas fa-users" />
          ملخص العملاء ←
        </Link>
      </div>

      {/* البحث والفلتر */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="ابحث باسم العميل..."
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="open">مفتوحة</option>
            <option value="paid">مسددة</option>
          </Select>
        </div>
        {(search || statusFilter !== 'all') && (
          <p className="text-xs text-slate-500 mt-2">
            نتائج البحث: <strong>{filtered.length}</strong> سجل
          </p>
        )}
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المفتوح</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totals.open)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المسدد</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totals.paid)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-sky-500">
          <p className="text-xs text-slate-500 mb-1">عدد السجلات</p>
          <p className="text-2xl font-bold text-sky-600">{filtered.length}</p>
        </div>
      </div>

      {/* الجدول */}
      <Card
        title={`كل المديونيات (${filtered.length})`}
        icon="fa-list"
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            columns={[
              '#',
              'العميل',
              'المبلغ',
              'ملاحظة',
              'التاريخ',
              'الوقت',
              'الحالة',
            ]}
            data={filtered}
            emptyMessage="لا توجد مديونيات"
            emptyIcon="fa-inbox"
            renderRow={(d, i) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-center text-sm">{i + 1}</td>
                <td className="px-3 py-2 text-center text-sm font-semibold">
                  <Link
                    to={`/customers/${d.customer_id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {d.app_customers?.name || '—'}
                  </Link>
                </td>
                <td className="px-3 py-2 text-center text-sm">
                  {formatCurrency(d.amount)}
                </td>
                <td className="px-3 py-2 text-center text-xs text-slate-500">
                  {d.note || '—'}
                </td>
                <td className="px-3 py-2 text-center text-sm">
                  {formatDate(d.created_at)}
                </td>
                <td className="px-3 py-2 text-center text-xs text-slate-500">
                  {formatTime(d.created_at)}
                </td>
                <td className="px-3 py-2 text-center">
                  {d.status === 'paid' ? (
                    <Badge color="success">مسددة</Badge>
                  ) : (
                    <Badge color="danger">مفتوحة</Badge>
                  )}
                </td>
              </tr>
            )}
          />
        )}
      </Card>
    </div>
  );
}