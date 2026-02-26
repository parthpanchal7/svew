import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { supabase } from "./lib/supabase";

import Navbar from "./components/Navbar";
import CreateInvoice from "./pages/CreateInvoice";
import Dashboard from "./pages/Dashboard";
import EditInvoice from "./pages/EditInvoice";
import Firms from "./pages/Firms";
import Invoices from "./pages/Invoices";
import Login from "./pages/Login";
import Parties from "./pages/Parties";
import ViewInvoice from "./pages/ViewInvoice";

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();
      setSession(activeSession);

      if (activeSession) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", activeSession.user.id)
          .single();

        setRole(data?.role);
      }

      setLoading(false);
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="page-card auth-card">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="app-shell">
      <Navbar role={role} />
      <Routes>
        <Route path="/dashboard" element={<Dashboard role={role} />} />
        <Route path="/invoices" element={<Invoices role={role} />} />
        <Route path="/parties" element={<Parties role={role} />} />
        <Route path="/firms" element={<Firms role={role} />} />
        <Route path="/create-invoice" element={<CreateInvoice role={role} />} />
        <Route path="/edit-invoice/:id" element={<EditInvoice />} />
        <Route path="/view-invoice/:id" element={<ViewInvoice />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

export default App;
