export default function Input({ label, icon, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block font-medium mb-1.5 text-slate-700 text-sm">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <i
            className={`${icon} absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm`}
          />
        )}
        <input
          className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm 
            transition focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent
            ${icon ? 'pr-11' : ''}`}
          {...props}
        />
      </div>
    </div>
  );
}