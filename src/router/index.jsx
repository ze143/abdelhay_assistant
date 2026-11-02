import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/Dashboard';
import WorkersPage from '../pages/workers/WorkersPage';
import WorkerProfilePage from '../pages/workers/WorkerProfilePage';
import AllClosingsPage from '../pages/workers/AllClosingsPage';
import QuickTransactionPage from '../pages/workers/QuickTransactionPage';
import CustomersPage from '../pages/customers/CustomersPage';
import CustomerProfilePage from '../pages/customers/CustomerProfilePage';
import CustomersDebtsPage from '../pages/debts/CustomersDebtsPage';
import AllDebtsPage from '../pages/debts/AllDebtsPage';

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
      { path: 'debts', element: <CustomersDebtsPage /> },
      { path: 'debts/all', element: <AllDebtsPage /> },
    ],
  },
]);