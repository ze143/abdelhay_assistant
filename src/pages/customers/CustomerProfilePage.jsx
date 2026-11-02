import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import { supabase } from "../../lib/supabase";
import { formatDate, formatTime, formatCurrency } from "../../lib/formatters";
import { printCustomerStatement } from "../../lib/printCustomerStatement";
import toast from "react-hot-toast";

export default function CustomerProfilePage() {
  const { id } = useParams();
  const customerId = Number(id);
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [debtModal, setDebtModal] = useState(false);
  const [debtForm, setDebtForm] = useState({ amount: "", note: "" });

  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", note: "" });

  const [deleteDebtConfirm, setDeleteDebtConfirm] = useState(null);

  // ==================== تحميل الداتا ====================
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        supabase
          .from("app_customers")
          .select("*")
          .eq("id", customerId)
          .single(),
        supabase
          .from("app_debts")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
      ]);

      if (cRes.error) {
        toast.error("العميل غير موجود");
        navigate("/customers");
        return;
      }

      setCustomer(cRes.data);
      setDebts(dRes.data || []);

      // ← ضيف السطور دي
      const open = (dRes.data || []).filter((d) => d.status === "open");
      console.log("🔵 loadAll - total debts:", dRes.data?.length);
      console.log("🔵 loadAll - open debts:", open.length);
      console.log(
        "🔵 loadAll - 530 amount:",
        dRes.data?.find((d) => d.id === 530)?.amount,
      );
      console.log(
        "🔵 loadAll - totalOpen:",
        open.reduce((s, d) => s + Number(d.amount || 0), 0),
      );
    } catch (e) {
      console.error("loadAll error:", e);
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [customerId, navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ==================== الحسابات ====================
  const openDebts = debts.filter((d) => d.status === "open");
  const paidDebts = debts.filter((d) => d.status === "paid");

  const totalOpen = openDebts.reduce((s, d) => s + Number(d.amount || 0), 0);
  const totalPaid = paidDebts.reduce((s, d) => s + Number(d.amount || 0), 0);

  // ==================== الإجراءات ====================
  const handleAddDebt = async () => {
    const amount = parseFloat(debtForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("أدخل مبلغاً صحيحاً");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("app_debts").insert([
      {
        customer_id: customerId,
        amount,
        note: debtForm.note.trim(),
        status: "open",
        created_at: new Date().toISOString(),
      },
    ]);
    setSubmitting(false);
    if (error) {
      toast.error("فشل الإضافة: " + error.message);
      return;
    }
    toast.success("✅ تم إضافة المديونية");
    setDebtModal(false);
    setDebtForm({ amount: "", note: "" });
    loadAll();
  };

  const handlePay = async () => {
    const amount = parseFloat(payForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("أدخل مبلغاً صحيحاً");
      return;
    }
    if (amount > totalOpen) {
      toast.error(
        `المبلغ أكبر من إجمالي المديونية (${formatCurrency(totalOpen)})`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const { error: payErr } = await supabase.from("app_payments").insert([
        {
          customer_id: customerId,
          amount,
          note: payForm.note.trim(),
          created_at: new Date().toISOString(),
        },
      ]);

      if (payErr) throw payErr;

      const { data: openList, error: openErr } = await supabase
        .from("app_debts")
        .select("id, amount")
        .eq("customer_id", customerId)
        .eq("status", "open")
        .order("created_at", { ascending: true });

      if (openErr) throw openErr;

      console.log("🔵 openList:", openList);
      console.log("🔵 amount to distribute:", amount);

      let remaining = amount;
      for (const debt of openList || []) {
        if (remaining <= 0) break;
        const debtAmt = Number(debt.amount);
        console.log(`🔵 debt ${debt.id}: ${debtAmt}, remaining: ${remaining}`);

        if (debtAmt <= remaining) {
          const { error } = await supabase
            .from("app_debts")
            .update({ status: "paid" }) // ← شيل amount
            .eq("id", debt.id);
          if (error) throw error;
          remaining -= debtAmt;
          console.log(`✅ قفلت ${debt.id} بالكامل (بمبلغ ${debtAmt})`);
        } else {
          const newAmount = debtAmt - remaining;
          const { error } = await supabase
            .from("app_debts")
            .update({ amount: newAmount })
            .eq("id", debt.id);
          if (error) throw error;
          console.log(`✅ خصمت ${remaining} من ${debt.id} → ${newAmount}`);
          remaining = 0;
        }
      }

      if (remaining > 0) {
        console.warn("⚠️ باقي مبلغ مش اتوزع:", remaining);
      }

      toast.success("✅ تم تسجيل السداد");
      setPayModal(false);
      setPayForm({ amount: "", note: "" });
      await loadAll();
    } catch (err) {
      console.error("🔴 handlePay error:", err);
      toast.error("فشل السداد: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDebt = async () => {
    setSubmitting(true);
    const { error } = await supabase
      .from("app_debts")
      .delete()
      .eq("id", deleteDebtConfirm.id);
    setSubmitting(false);
    if (error) {
      toast.error("فشل الحذف: " + error.message);
      return;
    }
    toast.success("🗑️ تم الحذف");
    setDeleteDebtConfirm(null);
    loadAll();
  };

  // ==================== العرض ====================
  if (loading) return <LoadingSpinner />;
  if (!customer) return null;

  return (
    <div>
      <button
        onClick={() => navigate("/customers")}
        className="mb-4 text-sm text-slate-500 hover:text-primary-600 flex items-center gap-2"
      >
        <i className="fas fa-arrow-right" />
        رجوع للعملاء
      </button>

      {/* بطاقة العميل */}
      <Card>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-3xl">
            <i className="fas fa-user" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-bold text-slate-800">
              {customer.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              الهاتف: {customer.phone || "—"}
              {" · "}
              تاريخ الإضافة: {formatDate(customer.created_at)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="info"
              icon="fa-print"
              onClick={() =>
                printCustomerStatement({
                  customer,
                  debts,
                  payments: paidDebts,
                  logoUrl: `${window.location.origin}/Asset-2.ico`,
                })
              }
            >
              طباعة كشف حساب
            </Button>
            <Button
              variant="danger"
              icon="fa-plus"
              onClick={() => setDebtModal(true)}
            >
              إضافة مديونية
            </Button>
            <Button
              variant="success"
              icon="fa-check"
              onClick={() => setPayModal(true)}
              disabled={totalOpen <= 0}
            >
              تسجيل سداد
            </Button>
          </div>
        </div>
      </Card>

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
          <p className="text-xs text-slate-500 mb-1">المديونية الحالية</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalOpen)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المسدد</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-amber-500">
          <p className="text-xs text-slate-500 mb-1">مديونيات مفتوحة</p>
          <p className="text-2xl font-bold text-amber-600">
            {openDebts.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-slate-400">
          <p className="text-xs text-slate-500 mb-1">مديونيات مسددة</p>
          <p className="text-2xl font-bold text-slate-700">
            {paidDebts.length}
          </p>
        </div>
      </div>

      {/* المديونيات المفتوحة */}
      <Card
        title={`المديونيات المفتوحة (${openDebts.length})`}
        icon="fa-file-invoice"
      >
        {openDebts.length === 0 ? (
          <EmptyState
            icon="fa-check-circle"
            iconColor="text-green-400"
            message="لا توجد مديونيات مفتوحة 🎉"
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-3 text-center text-sm">#</th>
                  <th className="py-3 px-3 text-center text-sm">المبلغ</th>
                  <th className="py-3 px-3 text-center text-sm">الملاحظة</th>
                  <th className="py-3 px-3 text-center text-sm">التاريخ</th>
                  <th className="py-3 px-3 text-center text-sm">الوقت</th>
                  <th className="py-3 px-3 text-center text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {openDebts.map((d, i) => (
                  <tr
                    key={d.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3 text-center text-sm">{i + 1}</td>
                    <td className="py-2 px-3 text-center text-sm font-semibold text-red-600">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {d.note || "—"}
                    </td>
                    <td className="py-2 px-3 text-center text-sm">
                      {formatDate(d.created_at)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {formatTime(d.created_at)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => setDeleteDebtConfirm(d)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        title="حذف"
                      >
                        <i className="fas fa-trash-alt text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-red-50 font-bold">
                  <td className="py-3 px-3 text-center text-sm">الإجمالي</td>
                  <td className="py-3 px-3 text-center text-sm text-red-700">
                    {formatCurrency(totalOpen)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* سجل السداد */}
      <Card title={`سجل السداد (${paidDebts.length})`} icon="fa-history">
        {paidDebts.length === 0 ? (
          <EmptyState icon="fa-inbox" message="لا توجد مدفوعات" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-3 text-center text-sm">#</th>
                  <th className="py-3 px-3 text-center text-sm">المبلغ</th>
                  <th className="py-3 px-3 text-center text-sm">الملاحظة</th>
                  <th className="py-3 px-3 text-center text-sm">التاريخ</th>
                  <th className="py-3 px-3 text-center text-sm">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {paidDebts.map((d, i) => (
                  <tr
                    key={d.id}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-2 px-3 text-center text-sm">{i + 1}</td>
                    <td className="py-2 px-3 text-center text-sm font-semibold text-green-600">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {d.note || "—"}
                    </td>
                    <td className="py-2 px-3 text-center text-sm">
                      {formatDate(d.created_at)}
                    </td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">
                      {formatTime(d.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-green-50 font-bold">
                  <td className="py-3 px-3 text-center text-sm">الإجمالي</td>
                  <td className="py-3 px-3 text-center text-sm text-green-700">
                    {formatCurrency(totalPaid)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* مودال إضافة مديونية */}
      <Modal
        open={debtModal}
        title="إضافة مديونية"
        icon="fa-plus-circle"
        onClose={() => setDebtModal(false)}
      >
        <div className="space-y-3">
          <Input
            label="المبلغ (جنيه)"
            type="number"
            step="0.5"
            min="0"
            value={debtForm.amount}
            onChange={(e) =>
              setDebtForm({ ...debtForm, amount: e.target.value })
            }
            placeholder="0"
          />
          <Input
            label="ملاحظة (اختياري)"
            value={debtForm.note}
            onChange={(e) => setDebtForm({ ...debtForm, note: e.target.value })}
            placeholder="تفاصيل"
          />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button
            variant="secondary"
            onClick={() => setDebtModal(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button variant="danger" onClick={handleAddDebt} loading={submitting}>
            إضافة
          </Button>
        </div>
      </Modal>

      {/* مودال سداد */}
      <Modal
        open={payModal}
        title="تسجيل سداد"
        icon="fa-check-circle"
        onClose={() => setPayModal(false)}
      >
        <div className="bg-sky-50 border-r-4 border-sky-500 p-3 rounded-xl mb-4 text-xs text-sky-800">
          <i className="fas fa-info-circle ml-1" />
          المديونية الحالية: <strong>{formatCurrency(totalOpen)}</strong>
          <br />
          السداد هيتوزع على أقدم المديونيات الأول.
        </div>
        <div className="space-y-3">
          <Input
            label="المبلغ المدفوع"
            type="number"
            step="0.5"
            min="0"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
            placeholder="0"
          />
          <Input
            label="ملاحظة (اختياري)"
            value={payForm.note}
            onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
            placeholder="تفاصيل السداد"
          />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button
            variant="secondary"
            onClick={() => setPayModal(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button variant="success" onClick={handlePay} loading={submitting}>
            تسجيل السداد
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteDebtConfirm}
        title="تأكيد الحذف"
        message={`حذف مديونية بقيمة ${deleteDebtConfirm?.amount} ج.م؟`}
        onConfirm={handleDeleteDebt}
        onCancel={() => setDeleteDebtConfirm(null)}
        loading={submitting}
      />
    </div>
  );
}
