export default function LoadingSpinner({ text = 'جاري التحميل...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <i className="fas fa-spinner fa-spin text-3xl mb-3 text-primary-600" />
      <p className="text-sm">{text}</p>
    </div>
  );
}