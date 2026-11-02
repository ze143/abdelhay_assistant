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
import { useCustomers } from '../../hooks/useCustomers';
import { formatDate, formatTime } from '../../lib/formatters';

export default function CustomersPage() {
  const {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers();
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [editCustomer, setEditCustomer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const s = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.phone || '').includes(search)
    );
  }, [customers, search]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setSubmitting(true);
    const ok = await addCustomer(name, newPhone.trim());
    setSubmitting(false);
    if (ok) {
      setNewName('');
      setNewPhone('');
    }
  };

  const openEdit = (c) => {
    setEditCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone || '');
  };

  const handleSaveEdit = async () => {
    const name = editName.trim();
    if (!name) return;
    setSubmitting(true);
    await updateCustomer(editCustomer.id, { name, phone: editPhone.trim() });
    setSubmitting(false);
    setEditCustomer(null);
  };

  const handleDelete = async () => {
    setSubmitting(true);
    await deleteCustomer(deleteConfirm.id);
    setSubmitting(false);
    setDeleteConfirm(null);
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-users" />
        إدارة العملاء
      </h1>

      <Card title="إضافة عميل جديد" icon="fa-user-plus">
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <Input
            label="اسم العميل"
            placeholder="مثال: أحمد علي"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            icon="fa-user"
            required
          />
          <Input
            label="رقم الهاتف (اختياري)"
            placeholder="01000000000"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            icon="fa-phone"
          />
          <Button type="submit" icon="fa-plus-circle" loading={submitting}>
            إضافة
          </Button>
        </form>
      </Card>

      <Card title="قائمة العملاء" icon="fa-list">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="ابحث بالاسم أو الهاتف..."
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <Table
            columns={['#', 'الاسم', 'الهاتف', 'تاريخ الإضافة', 'الوقت', 'إجراءات']}
            data={filtered}
            emptyMessage="لا يوجد عملاء"
            emptyIcon="fa-users"
            renderRow={(c, i) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-center text-sm">{i + 1}</td>
                <td className="px-3 py-3 text-center text-sm font-semibold">
                  <Link
                    to={`/customers/${c.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-center text-sm">{c.phone || '—'}</td>
                <td className="px-3 py-3 text-center text-sm">
                  {formatDate(c.created_at)}
                </td>
                <td className="px-3 py-3 text-center text-sm">
                  {formatTime(c.created_at)}
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      to={`/customers/${c.id}`}
                      className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 flex items-center justify-center"
                      title="ملف العميل"
                    >
                      <i className="fas fa-eye text-xs" />
                    </Link>
                    <button
                      onClick={() => openEdit(c)}
                      className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100"
                      title="تعديل"
                    >
                      <i className="fas fa-edit text-xs" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c)}
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
        open={!!editCustomer}
        title="تعديل بيانات العميل"
        icon="fa-edit"
        onClose={() => setEditCustomer(null)}
      >
        <div className="space-y-3">
          <Input
            label="الاسم"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input
            label="الهاتف"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Button
            variant="secondary"
            onClick={() => setEditCustomer(null)}
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
        message={`هل أنت متأكد من حذف العميل "${deleteConfirm?.name}"؟ سيتم حذف كل مديونياته ومدفوعاته.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        loading={submitting}
      />
    </div>
  );
}