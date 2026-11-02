export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    secondary: 'bg-slate-500 hover:bg-slate-600 text-white',
    info: 'bg-sky-500 hover:bg-sky-600 text-white',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full 
        font-semibold transition active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <i className="fas fa-spinner fa-spin" />
      ) : (
        icon && <i className={icon} />
      )}
      {children}
    </button>
  );
}