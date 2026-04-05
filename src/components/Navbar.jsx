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
          </div>
        </div>
        <button className="logout-btn-minimal" onClick={handleLogout} title="Logout">
          Log Out
        </button>
      </header>
 
      {/* Footer Navigation for Mobile */}
      <nav className="mobile-tabbar-bottom no-print">
        <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/dashboard">
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Home</span>
        </NavLink>
        <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/invoices">
          <span className="tab-icon">📋</span>
          <span className="tab-label">Bills</span>
        </NavLink>
        <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/create-invoice">
          <span className="tab-icon-plus">+</span>
          <span className="tab-label">Create</span>
        </NavLink>
        <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/ledger">
          <span className="tab-icon">📖</span>
          <span className="tab-label">Ledger</span>
        </NavLink>
        <NavLink className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`} to="/payments">
          <span className="tab-icon">💰</span>
          <span className="tab-label">Pay</span>
        </NavLink>
      </nav>
    </>
  );
}
