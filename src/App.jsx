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
    let isMounted = true;
    const loadingFallback = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 4000);

    const fetchRole = async (userId) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (isMounted) {
          setRole(data?.role || null);
        }
      } catch {
        if (isMounted) {
          setRole(null);
        }
      }
    };

    const init = async () => {
      try {
        const {
          data: { session: activeSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(activeSession || null);
        setLoading(false);

        if (activeSession?.user?.id) {
          void fetchRole(activeSession.user.id);
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setRole(null);
          setLoading(false);
        }
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (!isMounted) return;

      setSession(authSession || null);
      setLoading(false);

      if (authSession?.user?.id) {
        void fetchRole(authSession.user.id);
      } else {
        setRole(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingFallback);
      subscription.unsubscribe();
    };
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
      <main className="app-content">
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
      </main>
    </div>
  );
}

export default App;
