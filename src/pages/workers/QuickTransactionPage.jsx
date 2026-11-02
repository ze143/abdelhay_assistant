import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useWorkers } from '../../hooks/useWorkers';
import { supabase } from '../../lib/supabase';
import { formatDate, formatTime } from '../../lib/formatters';
import toast from 'react-hot-toast';

export default function QuickTransactionPage() {
  const { workers } = useWorkers();

  const [form, setForm] = useState({
    workerId: '',
    type: 'مكافأة',
    amount: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // تحميل آخر 10 حركات
  const loadRecent = async () => {
    setLoadingRecent(true);
    const { data } = await supabase
      .from('app_transactions')
      .select('*, app_workers(name)')
      .is('closing_id', null)
      .order('created_at', { ascending: false })
      .limit(10);
    setRecent(data || []);
    setLoadingRecent(false);
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.workerId || isNaN(amount) || amount <= 0) {
      toast.error('اختر عاملاً وأدخل مبلغاً صحيحاً');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('app_transactions').insert([
      {
        worker_id: Number(form.workerId),
        type: form.type,
        amount,
        note: form.note.trim(),
        created_at: new Date().toISOString(),
      },
    ]);
    setSubmitting(false);

    if (error) {
      toast.error('فشل التسجيل: ' + error.message);
      return;
    }

    toast.success(`✅ تم تسجيل ${form.type} بقيمة ${amount} ج.م`);
    setForm({ ...form, amount: '', note: '' });
    loadRecent();
  };

  // لون حسب النوع
  const typeColor = {
    مكافأة: 'border-green-500 bg-green-50',
    خصم: 'border-red-500 bg-red-50',
    سلفة: 'border-amber-500 bg-amber-50',
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-bolt" />
        إضافة سريعة — مكافأة / خصم / سلفة
      </h1>

      {/* فورم الإضافة */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اختيار العامل */}
          <Select
            label="العامل"
            value={form.workerId}
            onChange={(e) => setForm({ ...form, workerId: e.target.value })}
            required
          >
            <option value="">-- اختر العامل --</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.hourly_rate} ج.م/ساعة)
              </option>
            ))}
          </Select>

          {/* اختيار النوع — كروت بدل select */}
          <div>
            <label className="block font-medium mb-2 text-slate-700 text-sm">
              نوع الحركة
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['مكافأة', 'خصم', 'سلفة'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`py-3 px-2 rounded-xl border-2 font-semibold transition
                    ${
                      form.type === t
                        ? typeColor[t] + ' scale-105'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <i
                    className={`fas ${
                      t === 'مكافأة'
                        ? 'fa-gift'
                        : t === 'خصم'
                        ? 'fa-minus-circle'
                        : 'fa-hand-holding-usd'
                    } ml-2`}
                  />
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* المبلغ */}
          <Input
            label="المبلغ (جنيه)"
            type="number"
            step="0.5"
            min="0"
            placeholder="0"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            icon="fa-coins"
            required
          />

          {/* السبب */}
          <Input
            label="السبب (اختياري)"
            placeholder="مثال: مكافأة أداء، خصم تأخير، سلفة شخصية..."
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            icon="fa-comment"
          />

          {/* زرار */}
          <Button
            type="submit"
            icon="fa-save"
            loading={submitting}
            fullWidth
          >
            تسجيل {form.type}
          </Button>
        </form>
      </Card>

      {/* آخر 10 حركات */}
      <Card title={`آخر 10 حركات (${recent.length})`} icon="fa-history">
        {loadingRecent ? (
          <LoadingSpinner text="جاري تحميل الحركات..." />
        ) : recent.length === 0 ? (
          <EmptyState icon="fa-inbox" message="لا توجد حركات مسجلة" />
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {t.type === 'مكافأة' && (
                    <Badge color="success">مكافأة</Badge>
                  )}
                  {t.type === 'خصم' && <Badge color="danger">خصم</Badge>}
                  {t.type === 'سلفة' && <Badge color="warning">سلفة</Badge>}

                  <Link
                    to={`/workers/${t.worker_id}`}
                    className="font-semibold text-slate-800 text-sm hover:text-primary-600 truncate"
                  >
                    {t.app_workers?.name || '—'}
                  </Link>

                  {t.note && (
                    <span className="text-xs text-slate-500 truncate hidden md:inline">
                      — {t.note}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400 hidden md:inline">
                    {formatDate(t.created_at)} {formatTime(t.created_at)}
                  </span>
                  <span
                    className={`font-bold text-sm ${
                      t.type === 'مكافأة'
                        ? 'text-green-600'
                        : t.type === 'خصم'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {t.type === 'مكافأة' ? '+' : '-'}
                    {Number(t.amount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}