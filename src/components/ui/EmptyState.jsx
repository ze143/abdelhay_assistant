export default function EmptyState({
  icon = 'fa-inbox',
  message = 'لا توجد بيانات',
  iconColor = 'text-slate-400',
  textColor = 'text-slate-400',
  size = 'md',
}) {
  const sizes = {
    sm: { icon: 'text-2xl', wrap: 'py-6', text: 'text-xs' },
    md: { icon: 'text-4xl', wrap: 'py-12', text: 'text-sm' },
    lg: { icon: 'text-5xl', wrap: 'py-16', text: 'text-base' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div
      className={`flex flex-col items-center justify-center ${s.wrap} ${textColor}`}
    >
      <i className={`fas ${icon} ${s.icon} mb-3 ${iconColor}`} />
      <p className={s.text}>{message}</p>
    </div>
  );
}