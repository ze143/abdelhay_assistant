import Button from './Button';

export default function ConfirmDialog({
  open,
  title = 'تأكيد',
  message,
  onConfirm,
  onCancel,
  loading,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-red-600 text-xl" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            تأكيد
          </Button>
        </div>
      </div>
    </div>
  );
}