import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import SearchBar from "../../components/ui/SearchBar";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../lib/formatters";
import EmptyState from "../../components/ui/EmptyState";

export default function CustomersDebtsPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("app_debts")
        .select("*, app_customers(name, phone)")
        .order("created_at", { ascending: false });
      setDebts(data || []);
      setLoading(false);
    })();
  }, []);

  // تجميع بالعميل (المديونيات المفتوحة فقط)
  const byCustomer = useMemo(() => {
    const map = {};
    debts
      .filter((d) => d.status === "open")
      .forEach((d) => {
        const key = d.customer_id;
        if (!map[key]) {
          map[key] = {
            customerId: key,
            name: d.app_customers?.name || "—",
            phone: d.app_customers?.phone,
            total: 0,
            count: 0,
          };
        }
        map[key].total += Number(d.amount || 0);
        map[key].count += 1;
      });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [debts]);

  // فلترة بالبحث
  const filtered = useMemo(() => {
    if (!search.trim()) return byCustomer;
    const s = search.toLowerCase();
    return byCustomer.filter((c) => c.name.toLowerCase().includes(s));
  }, [byCustomer, search]);

  // الإحصائيات (على الكل مش المفلتر)
  const totals = useMemo(() => {
    const open = debts
      .filter((d) => d.status === "open")
      .reduce((s, d) => s + Number(d.amount || 0), 0);
    const paid = debts
      .filter((d) => d.status === "paid")
      .reduce((s, d) => s + Number(d.amount || 0), 0);
    return { open, paid };
  }, [debts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-600 flex items-center gap-3">
          <i className="fas fa-users" />
          مديونيات العملاء
        </h1>
        <Link
          to="/debts/all"
          className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition flex items-center gap-2"
        >
          <i className="fas fa-list" />
          سجل المديونيات الكامل ←
        </Link>
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
          <p className="text-xs text-slate-500 mb-1">عدد العملاء المدينين</p>
          <p className="text-2xl font-bold text-sky-600">{byCustomer.length}</p>
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
            نتائج البحث: <strong>{filtered.length}</strong> عميل
          </p>
        )}
      </div>

      {/* الجدول */}
      <Card title={`العملاء المدينين (${filtered.length})`} icon="fa-list">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="fa-check-circle"
            iconColor="text-green-400"
            message={
              search ? "لا توجد نتائج للبحث" : "لا توجد مديونيات مفتوحة 🎉"
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-3 text-center text-sm">#</th>
                  <th className="py-3 px-3 text-center text-sm">العميل</th>
                  <th className="py-3 px-3 text-center text-sm">الهاتف</th>
                  <th className="py-3 px-3 text-center text-sm">
                    عدد المديونيات
                  </th>
                  <th className="py-3 px-3 text-center text-sm">
                    إجمالي المديونية
                  </th>
                  <th className="py-3 px-3 text-center text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.customerId}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3 text-center text-sm">{i + 1}</td>
                    <td className="py-2 px-3 text-center text-sm font-semibold">
                      <Link
                        to={`/customers/${c.customerId}`}
                        className="text-primary-600 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-2 px-3 text-center text-sm">
                      {c.phone || "—"}
                    </td>
                    <td className="py-2 px-3 text-center text-sm">{c.count}</td>
                    <td className="py-2 px-3 text-center text-sm font-bold text-red-600">
                      {formatCurrency(c.total)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Link
                        to={`/customers/${c.customerId}`}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        عرض الملف ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan="4" className="py-3 px-3 text-center text-sm">
                    الإجمالي
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-red-700">
                    {formatCurrency(filtered.reduce((s, c) => s + c.total, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
