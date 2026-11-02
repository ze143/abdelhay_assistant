export default function Card({ title, icon, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm mb-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          {title && (
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {icon && <i className={`${icon} text-primary-600`} />}
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}