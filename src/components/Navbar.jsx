import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import BrandLogo from "./BrandLogo";

export default function Navbar({ role }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <>
      <header className="mobile-topbar no-print">
        <div className="brand-cluster">
          <BrandLogo size={34} compact />
          <div>
            <strong>SVEW Billing</strong>
            <p className="muted">Invoice Console</p>
          </div>
        </div>

        <button className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <nav className="mobile-tabbar no-print">
        <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/invoices">
          Invoices
        </NavLink>
        <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/create-invoice">
          New
        </NavLink>
        {role === "super_admin" && (
          <>
            <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/parties">
              Parties
            </NavLink>
            <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/firms">
              Firms
            </NavLink>
          </>
        )}
      </nav>
    </>
  );
}
