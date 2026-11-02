import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export function useClosings() {
  const [closings, setClosings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClosings = useCallback(async (workerId = null) => {
    setLoading(true);
    let query = supabase
      .from("app_closings")
      .select("*")
      .order("closed_at", { ascending: false });
    if (workerId) {
      query = query.eq("worker_id", workerId);
    }
    const { data, error } = await query;
    if (error) {
      toast.error("فشل تحميل التقفيلات: " + error.message);
      setClosings([]);
    } else {
      setClosings(data || []);
    }
    setLoading(false);
    return data || [];
  }, []);

  /**
   * تقفيل شهر لعامل
   * - يحسب إجمالي المكافآت/الخصومات/السلف
   * - يحفظ صف في app_closings
   * - يمسح الحركات اللي اتقفلت
   */
  const closeMonth = async (workerId, month, totalHours, hourlyRate) => {
    // 1) جلب الحركات غير المقفلة
    const { data: txns, error: txErr } = await supabase
      .from("app_transactions")
      .select("id, type, amount")
      .eq("worker_id", workerId)
      .is("closing_id", null);

    if (txErr) {
      toast.error("فشل قراءة الحركات: " + txErr.message);
      return false;
    }

    // 2) حساب الإجماليات
    let bonus = 0,
      discount = 0,
      advance = 0;
    (txns || []).forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "مكافأة") bonus += amt;
      if (t.type === "خصم") discount += amt;
      if (t.type === "سلفة") advance += amt;
    });

    const basePay = totalHours * hourlyRate;
    const netPay = basePay + bonus - discount - advance;

    // 3) حفظ التقفيل
    const { data: inserted, error: insertErr } = await supabase
      .from("app_closings")
      .insert([
        {
          worker_id: workerId,
          month,
          total_hours: totalHours,
          hourly_rate: hourlyRate,
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
      toast.error("فشل حفظ التقفيل: " + insertErr.message);
      return false;
    }

    // 4) ربط الحركات بالتقفيل (بدل المسح)
    if (txns?.length) {
      const { error: updErr } = await supabase
        .from("app_transactions")
        .update({ closing_id: inserted.id })
        .in(
          "id",
          txns.map((t) => t.id),
        );

      if (updErr) {
        toast.error("تم التقفيل لكن فشل ربط الحركات: " + updErr.message);
        return true;
      }
    }

    toast.success("✅ تم تقفيل الشهر بنجاح");
    return true;
  };

  useEffect(() => {
    fetchClosings();
  }, [fetchClosings]);

  return {
    closings,
    loading,
    closeMonth,
    refetch: fetchClosings,
  };
}
