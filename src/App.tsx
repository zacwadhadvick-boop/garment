/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Billing from './pages/Billing';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Packaging from './pages/Packaging';
import Purchase from './pages/Purchase';
import Accounting from './pages/Accounting';
import Marketing from './pages/Marketing';
import Warehouse from './pages/Warehouse';
import Login from './pages/Login';
import { storage, seedInitialData } from './db';
import { useEffect, useState } from 'react';

export default function App() {
  const [session, setSession] = useState(storage.getSession());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      seedInitialData();
    } catch (e) {
      console.error("Failed to seed data:", e);
      setError(e instanceof Error ? e : new Error("Failed to seed initial data"));
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
          <p className="text-gray-600 mt-2">{error.message}</p>
          <button onClick={() => window.location.reload()} className="mt-4 btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => setSession(storage.getSession())} />;
  }

  const isAdmin = session.role === 'Admin';

  return (
    <Router>
      <Shell user={session} onLogout={() => setSession(null)}>
        <Routes>
          <Route path="/" element={isAdmin ? <Dashboard /> : <Navigate to="/billing" />} />
          <Route path="/inventory" element={isAdmin ? <Inventory /> : <Navigate to="/billing" />} />
          <Route path="/customers" element={isAdmin ? <Customers /> : <Navigate to="/billing" />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/packaging" element={<Packaging />} />
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/marketing" element={isAdmin ? <Marketing /> : <Navigate to="/billing" />} />
          <Route path="/warehouse" element={isAdmin ? <Warehouse /> : <Navigate to="/billing" />} />
          <Route path="/accounting" element={isAdmin ? <Accounting /> : <Navigate to="/billing" />} />
          <Route path="/invoices" element={isAdmin ? <Invoices /> : <Navigate to="/billing" />} />
          <Route path="/reports" element={isAdmin ? <Reports /> : <Navigate to="/billing" />} />
          <Route path="/settings" element={isAdmin ? <Settings /> : <Navigate to="/billing" />} />
        </Routes>
      </Shell>
    </Router>
  );
}
