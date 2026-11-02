export default function Modal({ open, title, icon, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            {icon && <i className={`${icon} text-primary-600`} />}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <i className="fas fa-times" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}