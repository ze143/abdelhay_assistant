import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import WorkersPage from '../pages/workers/WorkersPage';
import WorkerProfilePage from '../pages/workers/WorkerProfilePage';
import AllClosingsPage from '../pages/workers/AllClosingsPage';
import QuickTransactionPage from '../pages/workers/QuickTransactionPage';
import CustomersPage from '../pages/customers/CustomersPage';
import CustomerProfilePage from '../pages/customers/CustomerProfilePage';
import PaymentsPage from '../pages/customers/PaymentsPage';
import CustomersDebtsPage from '../pages/debts/CustomersDebtsPage';
import AllDebtsPage from '../pages/debts/AllDebtsPage';
import InventoryDashboard from '../pages/inventory/InventoryDashboard';
import InventoryPage from '../pages/inventory/InventoryPage';
import SuppliesPage from '../pages/inventory/SuppliesPage';
import WithdrawalsPage from '../pages/inventory/WithdrawalsPage';
import SupplierAccountsPage from '../pages/inventory/SupplierAccountsPage';
import ConversionsPage from '../pages/inventory/ConversionsPage';
import InventorySettingsPage from '../pages/inventory/InventorySettingsPage';
import ReportsPage from '../pages/inventory/ReportsPage';
import StocktakePage from '../pages/inventory/StocktakePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <QuickTransactionPage /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'workers', element: <WorkersPage /> },
      { path: 'workers/quick', element: <QuickTransactionPage /> },
      { path: 'workers/:id', element: <WorkerProfilePage /> },
      { path: 'closings', element: <AllClosingsPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerProfilePage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'debts', element: <CustomersDebtsPage /> },
      { path: 'debts/all', element: <AllDebtsPage /> },

      // قسم المخزون
      { path: 'inventory-dashboard', element: <InventoryDashboard /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory/supplies', element: <SuppliesPage /> },
      { path: 'inventory/withdrawals', element: <WithdrawalsPage /> },
      { path: 'inventory/accounts', element: <SupplierAccountsPage /> },
      { path: 'inventory/conversions', element: <ConversionsPage /> },
      { path: 'inventory/settings', element: <InventorySettingsPage /> },
      { path: 'inventory/reports', element: <ReportsPage /> },
      { path: 'inventory/stocktake', element: <StocktakePage /> },
    ],
  },
]);