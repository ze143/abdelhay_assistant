export default function Header({ onMenuClick }) {
  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur border-b border-slate-100 px-4 md:px-8 py-4 z-20">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center"
        >
          <i className="fas fa-bars" />
        </button>

        <div className="text-sm text-slate-500 hidden md:block">
          {new Date().toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">المدير</span>
          <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center">
            <i className="fas fa-user" />
          </div>
        </div>
      </div>
    </header>
  );
}