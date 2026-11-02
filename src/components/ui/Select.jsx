export default function Select({ label, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block font-medium mb-1.5 text-slate-700 text-sm">
          {label}
        </label>
      )}
      <select
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm 
          focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent bg-white"
        {...props}
      >
        {children}
      </select>
    </div>
  );
}