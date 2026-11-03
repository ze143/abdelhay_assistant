import { useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import { useSupplierAccounts } from '../../hooks/inventory/useSupplierAccounts';
import { formatCurrency, toISODate } from '../../lib/formatters';
import toast from 'react-hot-toast';

export default function SupplierAccountsPage() {
  const { accounts, loading, addPayment } = useSupplierAccounts();
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({
    supplierId: '',
    amount: '',
    receiverName: '',
    method: 'كاش',
    paymentDate: toISODate(new Date()),
    notes: '',
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const s = search.toLowerCase();
    return accounts.filter((a) => a.name.toLowerCase().includes(s));
  }, [accounts, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, a) => ({
        purchases: acc.purchases + a.purchases,
        paid: acc.paid + a.paid,
        remaining: acc.remaining + (a.remaining > 0 ? a.remaining : 0),
      }),
      { purchases: 0, paid: 0, remaining: 0 }
    );
  }, [filtered]);

  const openPay = (account) => {
    setPayForm({
      supplierId: account.id,
      amount: '',
      receiverName: '',
      method: 'كاش',
      paymentDate: toISODate(new Date()),
      notes: '',
    });
    setPayModal(true);
  };

  const handlePay = async () => {
    const amount = parseFloat(payForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('أدخل مبلغاً صحيحاً');
      return;
    }
    if (!payForm.receiverName.trim()) {
      toast.error('أدخل اسم المستلم');
      return;
    }
    setSubmitting(true);
    const ok = await addPayment({
      supplierId: Number(payForm.supplierId),
      amount,
      receiverName: payForm.receiverName.trim(),
      method: payForm.method,
      date: payForm.paymentDate,
      notes: payForm.notes.trim(),
    });
    setSubmitting(false);
    if (ok) setPayModal(false);
  };

  const selectedAccount = accounts.find(
    (a) => a.id === Number(payForm.supplierId)
  );

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-hand-holding-usd" />
        حسابات الموردين
      </h1>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border-r-4 border-sky-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المشتريات</p>
          <p className="text-2xl font-bold text-sky-600">
            {formatCurrency(totals.purchases)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-green-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المدفوع</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totals.paid)}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border-r-4 border-red-500">
          <p className="text-xs text-slate-500 mb-1">إجمالي المتبقي</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totals.remaining)}
          </p>
        </div>
      </div>

      {/* البحث */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ابحث باسم المورد..."
        />
      </div>

      {/* الجدول */}
      <Card title={`حسابات الموردين (${filtered.length})`} icon="fa-users">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="fa-users" message="لا يوجد موردين" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="py-3 px-3 text-center text-sm">#</th>
                  <th className="py-3 px-3 text-center text-sm">المورد</th>
                  <th className="py-3 px-3 text-center text-sm">المشتريات</th>
                  <th className="py-3 px-3 text-center text-sm">المدفوع</th>
                  <th className="py-3 px-3 text-center text-sm">المتبقي</th>
                  <th className="py-3 px-3 text-center text-sm">الحالة</th>
                  <th className="py-3 px-3 text-center text-sm"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3 text-center text-sm">{i + 1}</td>
                    <td className="py-2 px-3 text-center text-sm font-semibold">
                      {a.name}
                      {a.is_factory && (
                        <span className="text-xs text-amber-600 mr-1">(مصنع)</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-sky-600">
                      {formatCurrency(a.purchases)}
                    </td>
                    <td className="py-2 px-3 text-center text-sm text-green-600">
                      {formatCurrency(a.paid)}
                    </td>
                    <td
                      className={`py-2 px-3 text-center text-sm font-bold ${
                        a.remaining > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(a.remaining))}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {a.remaining === 0 ? (
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          ✅ مدفوع
                        </span>
                      ) : a.remaining > 0 ? (
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                          ⚠️ دين
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-sky-100 text-sky-700">
                          💰 زيادة
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => openPay(a)}
                        disabled={a.remaining <= 0}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          a.remaining > 0
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        title="تسجيل سداد"
                      >
                        <i className="fas fa-money-bill-wave text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan="2" className="py-3 px-3 text-center text-sm">
                    الإجمالي
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-sky-700">
                    {formatCurrency(totals.purchases)}
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-green-700">
                    {formatCurrency(totals.paid)}
                  </td>
                  <td className="py-3 px-3 text-center text-sm text-red-700">
                    {formatCurrency(totals.remaining)}
                  </td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* مودال سداد */}
      <Modal
        open={payModal}
        title="تسجيل سداد"
        icon="fa-money-bill-wave"
        onClose={() => setPayModal(false)}
      >
        <div className="bg-sky-50 border-r-4 border-sky-500 p-3 rounded-xl mb-4 text-xs text-sky-800">
          <strong>المورد:</strong> {selectedAccount?.name}
          <br />
          <strong>المتبقي:</strong>{' '}
          {formatCurrency(selectedAccount?.remaining || 0)}
        </div>
        <div className="space-y-3">
          <Input
            label="المبلغ المدفوع"
            type="number"
            step="0.01"
            min="0"
            value={payForm.amount}
            onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
            placeholder="0"
            required
          />
          <Input
            label="اسم المستلم"
            value={payForm.receiverName}
            onChange={(e) =>
              setPayForm({ ...payForm, receiverName: e.target.value })
            }
            placeholder="مين استلم"
            required
          />
          <Select
            label="طريقة الدفع"
            value={payForm.method}
            onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
          >
            <option value="كاش">كاش</option>
            <option value="محفظة">محفظة</option>
            <option value="انستا">انستا</option>
            <option value="تحويل بنكي">تحويل بنكي</option>
          </Select>
          <Input
            label="تاريخ السداد"
            type="date"
            value={payForm.paymentDate}
            onChange={(e) =>
              setPayForm({ ...payForm, paymentDate: e.target.value })
            }
          />
          <Input
            label="ملاحظات (اختياري)"
            value={payForm.notes}
            onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
            placeholder="ملاحظات"
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
    </div>
  );
}