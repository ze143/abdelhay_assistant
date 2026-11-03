import { NavLink } from "react-router-dom";
import { useAlerts } from "../../hooks/useAlerts";

const sections = [
  {
    title: "العملاء",
    icon: "fa-users",
    links: [
      { to: "/customers", label: "العملاء", icon: "fa-user-plus", end: true },
      { to: "/debts", label: "مديونيات العملاء", icon: "fa-users", end: true },
      { to: "/debts/all", label: "سجل المديونيات", icon: "fa-list", end: true },
      {
        to: "/payments",
        label: "سجل المدفوعات",
        icon: "fa-money-bill-wave",
        end: true,
      },
    ],
  },
  {
    title: "العمال",
    icon: "fa-hard-hat",
    links: [
      { to: "/workers", label: "العمال", icon: "fa-user-cog", end: true },
      {
        to: "/closings",
        label: "أرشيف التقفيلات",
        icon: "fa-archive",
        end: true,
      },
    ],
  },
  {
    title: "المخزون والموردين",
    icon: "fa-boxes",
    links: [
      {
        to: "/inventory-dashboard",
        label: "لوحة المخزون",
        icon: "fa-chart-line",
        end: true,
      },
      { to: "/inventory", label: "المخزون", icon: "fa-boxes", end: true },
      {
        to: "/inventory/supplies",
        label: "التوريدات",
        icon: "fa-truck",
        end: true,
      },
      {
        to: "/inventory/withdrawals",
        label: "السحوبات",
        icon: "fa-download",
        end: true,
      },
      {
        to: "/inventory/accounts",
        label: "حسابات الموردين",
        icon: "fa-hand-holding-usd",
        end: true,
      },
      {
        to: "/inventory/conversions",
        label: "التحويلات",
        icon: "fa-exchange-alt",
        end: true,
      },
      {
        to: "/inventory/reports",
        label: "التقارير",
        icon: "fa-chart-bar",
        end: true,
      },
      {
        to: "/inventory/stocktake",
        label: "الجرد الدوري",
        icon: "fa-clipboard-check",
        end: true,
      },
      {
        to: "/inventory/settings",
        label: "الإعدادات",
        icon: "fa-cog",
        end: true,
      },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { lowStock, supplierDebts, pendingTransactions, totalCount } =
    useAlerts();

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
          {/* إضافة سريعة */}
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
              `flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl mb-2 text-sm font-medium transition
              ${isActive ? "bg-primary-600 text-white" : "text-slate-700 hover:bg-primary-50"}`
            }
          >
            <span className="flex items-center gap-3">
              <i className="fas fa-home w-5" />
              الرئيسية
            </span>
          </NavLink>

          {sections.map((section) => (
            <div key={section.title} className="mt-5">
              <p className="text-xs font-bold text-slate-400 px-4 mb-2 flex items-center gap-2">
                <i className={`fas ${section.icon}`} />
                {section.title}
              </p>
              {section.links.map((link) => {
                const showLowStockBadge =
                  link.to === "/inventory-dashboard" && lowStock.length > 0;
                const showDebtsBadge =
                  link.to === "/inventory/accounts" && supplierDebts.length > 0;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl mb-1 text-sm transition
                      ${isActive ? "bg-primary-600 text-white" : "text-slate-700 hover:bg-primary-50"}`
                    }
                  >
                    <span className="flex items-center gap-3">
                      <i className={`fas ${link.icon} w-5`} />
                      {link.label}
                    </span>
                    {showLowStockBadge && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
                        {lowStock.length}
                      </span>
                    )}
                    {showDebtsBadge && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                        {supplierDebts.length}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
