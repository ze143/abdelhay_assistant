import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SearchBar from '../../components/ui/SearchBar';
import { useWorkers } from '../../hooks/useWorkers';
import { formatDate, formatTime } from '../../lib/formatters';

export default function WorkersPage() {
  const { workers, loading, addWorker, updateWorker, deleteWorker } = useWorkers();
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // فورم الإضافة
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');

  // التعديل
  const [editWorker, setEditWorker] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');

  // الحذف
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return workers;
    const s = search.toLowerCase();
    return workers.filter((w) => w.name.toLowerCase().includes(s));
  }, [workers, search]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    const rate = parseFloat(newRate);
    if (!name || isNaN(rate) || rate <= 0) return;
    setSubmitting(true);
    const ok = await addWorker(name, rate);
    setSubmitting(false);
    if (ok) {
      setNewName('');
      setNewRate('');
    }
  };

  const openEdit = (w) => {
    setEditWorker(w);
    setEditName(w.name);
    setEditRate(w.hourly_rate);
  };

  const handleSaveEdit = async () => {
    const name = editName.trim();
    const rate = parseFloat(editRate);
    if (!name || isNaN(rate) || rate <= 0) return;
    setSubmitting(true);
    await updateWorker(editWorker.id, { name, hourly_rate: rate });
    setSubmitting(false);
    setEditWorker(null);
  };

  const handleDelete = async () => {
    setSubmitting(true);
    await deleteWorker(deleteConfirm.id);
    setSubmitting(false);
    setDeleteConfirm(null);
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-hard-hat" />
        إدارة العمال
      </h1>

      <Card title="إضافة عامل جديد" icon="fa-user-plus">
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <Input
            label="اسم العامل"
            placeholder="مثال: أحمد علي"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            icon="fa-user"
            required
          />
          <Input
            label="سعر الساعة (جنيه)"
            type="number"
            step="0.5"
            min="0"
            placeholder="50"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            icon="fa-coins"
            required
          />
          <Button type="submit" icon="fa-plus-circle" loading={submitting}>
            إضافة
          </Button>
        </form>
      </Card>

      <Card title="قائمة العمال" icon="fa-list">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ابحث باسم العامل..."
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            columns={['#', 'الاسم', 'سعر الساعة', 'تاريخ الإضافة', 'الوقت', 'إجراءات']}
            data={filtered}
            emptyMessage="لا يوجد عمال"
            emptyIcon="fa-hard-hat"
            renderRow={(w, i) => (
              <tr key={w.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-center text-sm">{i + 1}</td>
                <td className="px-3 py-3 text-center text-sm font-semibold">
                  <Link
                    to={`/workers/${w.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {w.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-center text-sm">
                  {w.hourly_rate} ج.م
                </td>
                <td className="px-3 py-3 text-center text-sm">
                  {formatDate(w.created_at)}
                </td>
                <td className="px-3 py-3 text-center text-sm">
                  {formatTime(w.created_at)}
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={`/workers/${w.id}`}
                      className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 flex items-center justify-center"
                      title="ملف العامل"
                    >
                      <i className="fas fa-eye text-xs" />
                    </Link>
                    <button
                      onClick={() => openEdit(w)}
                      className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
                      title="تعديل"
                    >
                      <i className="fas fa-edit text-xs" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(w)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      title="حذف"
                    >
                      <i className="fas fa-trash-alt text-xs" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}
      </Card>

      <Modal
        open={!!editWorker}
        title="تعديل بيانات العامل"
        icon="fa-edit"
        onClose={() => setEditWorker(null)}
      >
        <div className="space-y-3">
          <Input
            label="الاسم"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label="سعر الساعة"
            type="number"
            step="0.5"
            value={editRate}
            onChange={(e) => setEditRate(e.target.value)}
          />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button
            variant="secondary"
            onClick={() => setEditWorker(null)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button onClick={handleSaveEdit} loading={submitting}>
            حفظ
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف العامل "${deleteConfirm?.name}"؟ سيتم حذف كل سجلاته نهائياً.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={submitting}
      />
    </div>
  );
}