import { NavLink } from "react-router-dom";

const sections = [
  {
    title: "العملاء",
    icon: "fa-users",
    links: [
      { to: "/customers", label: "العملاء", icon: "fa-user-plus", end: true },
      { to: "/debts", label: "مديونيات العملاء", icon: "fa-users", end: true },
      { to: "/debts/all", label: "سجل المديونيات", icon: "fa-list", end: true },
    ],
  },
  {
    title: "العمال",
    icon: "fa-hard-hat",
    links: [
      { to: "/workers", label: "العمال", icon: "fa-user-cog", end: true },
      { to: "/closings", label: "أرشيف التقفيلات", icon: "fa-archive", end: true },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-40
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-primary-600 flex items-center gap-2">
            <i className="fas fa-utensils" />
            مطعم عبدالحي
          </h1>
          <p className="text-xs text-slate-500 mt-1">نظام الإدارة</p>
        </div>

        <nav className="p-4 overflow-y-auto h-[calc(100%-100px)]">
          {/* إضافة سريعة — الصفحة الافتراضية */}
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl mb-2 text-sm font-semibold transition
              ${
                isActive
                  ? "bg-amber-500 text-white shadow-md"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`
            }
          >
            <i className="fas fa-bolt w-5" />
            إضافة سريعة ⚡
          </NavLink>

          {/* الرئيسية */}
          <NavLink
            to="/dashboard"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl mb-2 text-sm font-medium transition
              ${isActive ? "bg-primary-600 text-white" : "text-slate-700 hover:bg-primary-50"}`
            }
          >
            <i className="fas fa-home w-5" />
            الرئيسية
          </NavLink>

          {sections.map((section) => (
            <div key={section.title} className="mt-5">
              <p className="text-xs font-bold text-slate-400 px-4 mb-2 flex items-center gap-2">
                <i className={`fas ${section.icon}`} />
                {section.title}
              </p>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1 text-sm transition
                    ${isActive ? "bg-primary-600 text-white" : "text-slate-700 hover:bg-primary-50"}`
                  }
                >
                  <i className={`fas ${link.icon} w-5`} />
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}