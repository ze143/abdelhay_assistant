import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { supabase } from "../../lib/supabase";
import {
  formatDate,
  formatTime,
  formatCurrency,
  currentMonth,
  monthLabel,
} from "../../lib/formatters";
import { printClosing } from "../../lib/printClosing";
import toast from "react-hot-toast";
import EmptyState from "../../components/ui/EmptyState";

export default function WorkerProfilePage() {
  const { id } = useParams();
  const workerId = Number(id);
  const navigate = useNavigate();

  // ==================== State ====================
  const [worker, setWorker] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // مودال إضافة حركة
  const [txnModal, setTxnModal] = useState(false);
  const [txnForm, setTxnForm] = useState({
    type: "مكافأة",
    amount: "",
    note: "",
  });

  // مودال تقفيل الشهر
  const [closeModal, setCloseModal] = useState(false);
  const [closeForm, setCloseForm] = useState({
    month: currentMonth(),
    hours: "",
  });

  // تأكيد حذف حركة
  const [deleteTxn, setDeleteTxn] = useState(null);

  // ==================== Load All Data ====================
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, tRes, cRes] = await Promise.all([
        supabase.from("app_workers").select("*").eq("id", workerId).single(),
        supabase
          .from("app_transactions")
          .select("*")
          .eq("worker_id", workerId)
          .is("closing_id", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("app_closings")
          .select("*")
          .eq("worker_id", workerId)
          .order("closed_at", { ascending: false }),
      ]);

      if (wRes.error) {
        toast.error("العامل غير موجود");
        navigate("/workers");
        return;
      }

      setWorker(wRes.data);
      setTransactions(tRes.data || []);
      setClosings(cRes.data || []);
    } catch (e) {
      console.error("loadAll error:", e);
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [workerId, navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ==================== Computed Totals ====================
  const totals = transactions.reduce(
    (acc, t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "مكافأة") acc.bonus += amt;
      if (t.type === "خصم") acc.discount += amt;
      if (t.type === "سلفة") acc.advance += amt;
      return acc;
    },
    { bonus: 0, discount: 0, advance: 0 },
  );
  totals.net = totals.bonus - totals.discount - totals.advance;

  // ==================== Actions ====================
  const handleAddTxn = async () => {
    const amount = parseFloat(txnForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("أدخل مبلغاً صحيحاً");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("app_transactions").insert([
      {
        worker_id: workerId,
        type: txnForm.type,
        amount,
        note: txnForm.note.trim(),
        created_at: new Date().toISOString(),
      },
    ]);
    setSubmitting(false);
    if (error) {
      toast.error("فشل التسجيل: " + error.message);
      return;
    }
    toast.success("✅ تم التسجيل");
    setTxnModal(false);
    setTxnForm({ type: "مكافأة", amount: "", note: "" });
    loadAll();
  };

  const handleDeleteTxn = async () => {
    setSubmitting(true);
    const { error } = await supabase
      .from("app_transactions")
      .delete()
      .eq("id", deleteTxn.id);
    setSubmitting(false);
    if (error) {
      toast.error("فشل الحذف: " + error.message);
      return;
    }
    toast.success("🗑️ تم الحذف");
    setDeleteTxn(null);
    loadAll();
  };

  const selectedMonthClosed = closings.some((c) => c.month === closeForm.month);

  const handleCloseMonth = async () => {
    const hours = parseFloat(closeForm.hours);
    if (!closeForm.month || isNaN(hours) || hours <= 0) {
      toast.error("أدخل الشهر وعدد الساعات");
      return;
    }
    if (selectedMonthClosed) {
      toast.error("الشهر ده متقفل بالفعل");
      return;
    }

    setSubmitting(true);

    // 1) حساب الإجماليات
    const bonus = totals.bonus;
    const discount = totals.discount;
    const advance = totals.advance;
    const rate = Number(worker.hourly_rate);
    const basePay = hours * rate;
    const netPay = basePay + bonus - discount - advance;

    // 2) حفظ التقفيل
    const { data: inserted, error: insertErr } = await supabase
      .from("app_closings")
      .insert([
        {
          worker_id: workerId,
          month: closeForm.month,
          total_hours: hours,
          hourly_rate: rate,
          base_pay: basePay,
          total_bonuses: bonus,
          total_discounts: discount,
          total_advances: advance,
          net_pay: netPay,
        },
      ])
      .select()
      .single();

    if (insertErr) {
      setSubmitting(false);
      toast.error("فشل حفظ التقفيل: " + insertErr.message);
      return;
    }

    // 3) ربط الحركات بالتقفيل
    if (transactions.length > 0) {
      const ids = transactions.map((t) => t.id);
      await supabase
        .from("app_transactions")
        .update({ closing_id: inserted.id })
        .in("id", ids);
    }

    setSubmitting(false);
    toast.success("✅ تم تقفيل الشهر");
    setCloseModal(false);
    setCloseForm({ month: currentMonth(), hours: "" });
    loadAll();
  };

  // ==================== Render ====================
  if (loading) return <LoadingSpinner />;
  if (!worker) return null;

  return (
    <div>
      <button
        onClick={() => navigate("/workers")}
        className="mb-4 text-sm text-slate-500 hover:text-primary-600 flex items-center gap-2"
      >
        <i className="fas fa-arrow-right" />
        رجوع للعمال
      </button>

      {/* بطاقة العامل */}
      <Card>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-3xl">
            <i className="fas fa-user" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-bold text-slate-800">{worker.name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              سعر الساعة:{" "}
              <strong className="text-primary-600">
                {worker.hourly_rate} ج.م
              </strong>
              {" · "}
              تاريخ الإضافة: {formatDate(worker.created_at)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="success"
              icon="fa-plus"
              onClick={() => setTxnModal(true)}
            >
              إضافة حركة
            </Button>
            <Button
              variant="info"
              icon="fa-lock"
              onClick={() => setCloseModal(true)}
            >
              تقفيل الشهر
            </Button>
          </div>
        </div>
      </Card>

      {/* بطاقات الرصيد */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
          <p className="text-xs text-slate-500 mb-1">مكافآت معلقة</p>
          <p className="text-2xl font-bold text-green-600">
            +{totals.bonus.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
          <p className="text-xs text-slate-500 mb-1">خصومات معلقة</p>
          <p className="text-2xl font-bold text-red-600">
            -{totals.discount.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-amber-500">
          <p className="text-xs text-slate-500 mb-1">سلف معلقة</p>
          <p className="text-2xl font-bold text-amber-600">
            -{totals.advance.toFixed(2)}
          </p>
        </div>
        <div
          className={`bg-white rounded-2xl p-5 border-r-4 ${
            totals.net >= 0 ? "border-primary-600" : "border-red-600"
          }`}
        >
          <p className="text-xs text-slate-500 mb-1">صافي الرصيد الحالي</p>
          <p
            className={`text-2xl font-bold ${
              totals.net >= 0 ? "text-primary-600" : "text-red-600"
            }`}
          >
            {totals.net >= 0 ? "+" : ""}
            {totals.net.toFixed(2)}
          </p>
        </div>
      </div>

      {/* الحركات الحالية */}
      <Card
        title={`حركات الشهر الحالي (${transactions.length})`}
        icon="fa-list"
      >
        {transactions.length === 0 ? (
          <EmptyState icon="fa-inbox" message="لا توجد حركات" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-3 text-center text-sm">#</th>
                  <th className="py-3 px-3 text-center text-sm">النوع</th>
                  <th className="py-3 px-3 text-center text-sm">المبلغ</th>
                  <th className="py-3 px-3 text-center text-sm">ملاحظة</th>
                  <th className="py-3 px-3 text-center text-sm">التاريخ</th>
                  <th className="py-3 px-3 text-center text-sm">الوقت</th>
                  <th className="py-3 px-3 text-center text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3 text-center text-sm">{i + 1}</td>
                    <td className="py-2 px-3 text-center">
                      {t.type === "مكافأة" && (
                        <Badge color="success">مكافأة</Badge>
                      )}
                      {t.type === "خصم" && <Badge color="danger">خصم</Badge>}
                      {t.type === "سلفة" && <Badge color="warning">سلفة</Badge>}
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-semibold">
                      {Number(t.amount).toFixed(2)} ج.م
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {t.note || "—"}
                    </td>
                    <td className="py-2 px-3 text-center text-sm">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {formatTime(t.created_at)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => setDeleteTxn(t)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        title="حذف"
                      >
                        <i className="fas fa-trash-alt text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* الأرشيف */}
      <Card title={`أرشيف التقفيلات (${closings.length})`} icon="fa-archive">
        {closings.length === 0 ? (
          <EmptyState icon="fa-archive" message="لا توجد تقفيلات بعد" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-3 text-center text-sm">الشهر</th>
                  <th className="py-3 px-3 text-center text-sm">الساعات</th>
                  <th className="py-3 px-3 text-center text-sm">الأساسي</th>
                  <th className="py-3 px-3 text-center text-sm">مكافآت</th>
                  <th className="py-3 px-3 text-center text-sm">خصومات</th>
                  <th className="py-3 px-3 text-center text-sm">سلف</th>
                  <th className="py-3 px-3 text-center text-sm">الصافي</th>
                  <th className="py-3 px-3 text-center text-sm">
                    تاريخ التقفيل
                  </th>
                  <th className="py-3 px-3 text-center text-sm">طباعة</th>
                </tr>
              </thead>
              <tbody>
                {closings.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3 text-center text-sm font-semibold text-primary-600">
                      {monthLabel(c.month)}
                    </td>
                    <td className="py-2 px-3 text-center text-sm">
                      {c.total_hours}
                    </td>
                    <td className="py-2 px-3 text-center text-sm">
                      {formatCurrency(c.base_pay)}
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-green-600">
                      +{Number(c.total_bonuses).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-red-600">
                      -{Number(c.total_discounts).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-amber-600">
                      -{Number(c.total_advances).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center text-sm font-bold text-primary-600">
                      {formatCurrency(c.net_pay)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {formatDate(c.closed_at)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => printClosing(c, worker.name)}
                        className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
                        title="طباعة"
                      >
                        <i className="fas fa-print text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* مودال إضافة حركة */}
      <Modal
        open={txnModal}
        title="إضافة حركة جديدة"
        icon="fa-plus-circle"
        onClose={() => setTxnModal(false)}
      >
        <div className="space-y-3">
          <Select
            label="النوع"
            value={txnForm.type}
            onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value })}
          >
            <option value="مكافأة">مكافأة</option>
            <option value="خصم">خصم</option>
            <option value="سلفة">سلفة</option>
          </Select>
          <Input
            label="المبلغ (جنيه)"
            type="number"
            step="0.5"
            min="0"
            value={txnForm.amount}
            onChange={(e) => setTxnForm({ ...txnForm, amount: e.target.value })}
            placeholder="0"
          />
          <Input
            label="ملاحظة (اختياري)"
            value={txnForm.note}
            onChange={(e) => setTxnForm({ ...txnForm, note: e.target.value })}
            placeholder="سبب العملية"
          />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button
            variant="secondary"
            onClick={() => setTxnModal(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button onClick={handleAddTxn} loading={submitting}>
            تسجيل
          </Button>
        </div>
      </Modal>

      {/* مودال تقفيل الشهر */}
      <Modal
        open={closeModal}
        title="تقفيل الشهر"
        icon="fa-lock"
        onClose={() => setCloseModal(false)}
      >
        <div className="bg-amber-50 border-r-4 border-amber-500 p-3 rounded-xl mb-4 text-xs text-amber-800">
          <i className="fas fa-info-circle ml-1" />
          التقفيل هيحفظ سجل دائم للشهر ده ويصفّر رصيد العامل.
        </div>
        <div className="space-y-3">
          <Input
            label="الشهر"
            type="month"
            value={closeForm.month}
            onChange={(e) =>
              setCloseForm({ ...closeForm, month: e.target.value })
            }
          />
          {selectedMonthClosed && closeForm.month && (
            <div className="bg-red-50 border-r-4 border-red-500 p-3 rounded-xl text-sm text-red-700">
              <i className="fas fa-exclamation-triangle ml-1" />
              الشهر <strong>{monthLabel(closeForm.month)}</strong> متقفل بالفعل.
            </div>
          )}
          <Input
            label="عدد ساعات الشهر"
            type="number"
            step="0.5"
            min="0"
            value={closeForm.hours}
            onChange={(e) =>
              setCloseForm({ ...closeForm, hours: e.target.value })
            }
            placeholder="مثال: 200"
          />
          {closeForm.hours && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">الأساسي:</span>
                <span className="font-semibold">
                  {formatCurrency(
                    parseFloat(closeForm.hours || 0) *
                      Number(worker.hourly_rate),
                  )}
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>مكافآت:</span>
                <span>+{totals.bonus.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>خصومات:</span>
                <span>-{totals.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>سلف:</span>
                <span>-{totals.advance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 mt-1 font-bold text-primary-600 text-base">
                <span>الصافي:</span>
                <span>
                  {formatCurrency(
                    parseFloat(closeForm.hours || 0) *
                      Number(worker.hourly_rate) +
                      totals.net,
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button
            variant="secondary"
            onClick={() => setCloseModal(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button
            variant="success"
            onClick={handleCloseMonth}
            loading={submitting}
            disabled={selectedMonthClosed}
          >
            تأكيد التقفيل
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTxn}
        title="تأكيد حذف الحركة"
        message={`حذف ${deleteTxn?.type} بقيمة ${deleteTxn?.amount} ج.م؟`}
        onConfirm={handleDeleteTxn}
        onCancel={() => setDeleteTxn(null)}
        loading={submitting}
      />
    </div>
  );
}
