import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StockReport from '../../components/inventory/StockReport';
import MovementReport from '../../components/inventory/MovementReport';
import ConsumptionReport from '../../components/inventory/ConsumptionReport';
import SuppliesReport from '../../components/inventory/SuppliesReport';

const tabs = [
  { key: 'stock', label: 'المخزون الحالي', icon: 'fa-boxes' },
  { key: 'movement', label: 'حركة المخزون', icon: 'fa-exchange-alt' },
  { key: 'consumption', label: 'الاستهلاك', icon: 'fa-fire' },
  { key: 'supplies', label: 'التوريدات', icon: 'fa-truck' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-primary-600 mb-6 flex items-center gap-3">
        <i className="fas fa-chart-bar" />
        تقارير المخزون
      </h1>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 mb-6 shadow-sm flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex-1 min-w-[120px] justify-center
              ${
                activeTab === t.key
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
          >
            <i className={`fas ${t.icon}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* المحتوى */}
      {activeTab === 'stock' && <StockReport />}
      {activeTab === 'movement' && <MovementReport />}
      {activeTab === 'consumption' && <ConsumptionReport />}
      {activeTab === 'supplies' && <SuppliesReport />}
    </div>
  );
}