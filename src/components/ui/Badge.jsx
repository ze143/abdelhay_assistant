const colors = {
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-amber-100 text-amber-800',
  info: 'bg-sky-100 text-sky-800',
  default: 'bg-slate-100 text-slate-700',
};

export default function Badge({ children, color = 'default' }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors[color]}`}
    >
      {children}
    </span>
  );
}