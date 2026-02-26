import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Navbar({ role }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="navbar no-print">
      <nav className="nav-links">
        <Link className="nav-link" to="/dashboard">
          Dashboard
        </Link>
        <Link className="nav-link" to="/invoices">
          Invoices
        </Link>
        <Link className="nav-link" to="/create-invoice">
          Create Invoice
        </Link>

        {role === "super_admin" && (
          <>
            <Link className="nav-link" to="/parties">
              Parties
            </Link>
            <Link className="nav-link" to="/firms">
              Firms
            </Link>
          </>
        )}
      </nav>

      <button className="secondary" onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}
