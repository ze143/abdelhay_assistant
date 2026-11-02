import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import SearchBar from "../../components/ui/SearchBar";
import Select from "../../components/ui/Select";
import Input from "../../components/ui/Input";
import { supabase } from "../../lib/supabase";
import { formatDate, formatCurrency, monthLabel } from "../../lib/formatters";
import { printClosing } from '../../lib/printClosing';

export default function AllClosingsPage() {
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cRes, wRes] = await Promise.all([
        supabase
          .from("app_closings")
          .select("*, app_workers(name)")
          .order("closed_at", { ascending: false }),
        supabase.from("app_workers").select("id, name").order("name"),
      ]);
      setClosings(cRes.data || []);
      setWorkers(wRes.data || []);
      setLoading(false);
    })();
  }, []);

  const months = useMemo(() => {
    const set = new Set(closings.map((c) => c.month));
    return Array.from(set).sort().reverse();
  }, [closings]);

  const filtered = useMemo(() => {
    return closings.filter((c) => {
      const name = c.app_workers?.name || "";
      if (search && !name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (monthFilter && c.month !== monthFilter) return false;
      if (workerFilter && String(c.worker_id) !== workerFilter) return false;
      return true;
    });
  }, [closings, search, monthFilter, workerFilter]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, c) => ({
        hours: acc.hours + Number(c.total_hours || 0),
        base: acc.base + Number(c.base_pay || 0),
        bonus: acc.bonus + Number(c.total_bonuses || 0),
        discount: acc.discount + Number(c.total_discounts || 0),
        advance: acc.advance + Number(c.total_advances || 0),
        net: acc.net + Number(c.net_pay || 0),
      }),
      { hours: 0, base: 0, bonus: 0, discount: 0, advance: 0, net: 0 },
    );
  }, [filtered]);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-archive" />
        أرشيف التقفيلات
      </h1>

      {/* ملخص */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-sky-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي الساعات</p>
          <p className="text-2xl font-bold text-sky-600">
            {totals.hours.toFixed(1)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المكافآت</p>
          <p className="text-2xl font-bold text-green-600">
            +{totals.bonus.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي الخصومات + السلف</p>
          <p className="text-2xl font-bold text-red-600">
            -{(totals.discount + totals.advance).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-primary-600">
          <p className="text-xs text-slate-500 mb-1">إجمالي الصافي</p>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(totals.net)}
          </p>
        </div>
      </div>

      <Card title="كل التقفيلات" icon="fa-list">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="ابحث باسم العامل..."
          />
          <Select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="">كل الشهور</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </Select>
          <Select
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
          >
            <option value="">كل العمال</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            columns={[
              "الشهر",
              "العامل",
              "الساعات",
              "الأساسي",
              "مكافآت",
              "خصومات",
              "سلف",
              "الصافي",
              "تاريخ التقفيل",
              "طباعة",
            ]}
            data={filtered}
            emptyMessage="لا توجد تقفيلات"
            emptyIcon="fa-archive"
            renderRow={(c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-center text-sm font-semibold text-primary-600">
                  {monthLabel(c.month)}
                </td>
                <td className="px-3 py-2 text-center text-sm">
                  <Link
                    to={`/workers/${c.worker_id}`}
                    className="text-primary-600 hover:underline font-semibold"
                  >
                    {c.app_workers?.name || "—"}
                  </Link>
                </td>
                <td className="px-3 py-2 text-center text-sm">
                  {c.total_hours}
                </td>
                <td className="px-3 py-2 text-center text-sm">
                  {formatCurrency(c.base_pay)}
                </td>
                <td className="px-3 py-2 text-center text-sm text-green-600">
                  +{Number(c.total_bonuses).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center text-sm text-red-600">
                  -{Number(c.total_discounts).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center text-sm text-amber-600">
                  -{Number(c.total_advances).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center text-sm font-bold text-primary-600">
                  {formatCurrency(c.net_pay)}
                </td>
                <td className="px-3 py-2 text-center text-xs text-slate-500">
                  {formatDate(c.closed_at)}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => printClosing(c, c.app_workers?.name || "—")}
                    className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
                    title="طباعة"
                  >
                    <i className="fas fa-print text-xs" />
                  </button>
                </td>
              </tr>
            )}
          />
        )}
      </Card>
    </div>
  );
}
