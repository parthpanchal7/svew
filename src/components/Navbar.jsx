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
      {/* Desktop Navigation */}
      <header className="navbar-desktop no-print">
        <div className="brand-cluster">
          <BrandLogo size={34} compact />
          <div>
            <strong>SVEW Billing</strong>
            <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>Invoice Console</p>
          </div>
        </div>
        <nav className="desktop-nav-links">
          <NavLink className={({ isActive }) => `desktop-link ${isActive ? "active" : ""}`} to="/dashboard">Dashboard</NavLink>
          <NavLink className={({ isActive }) => `desktop-link ${isActive ? "active" : ""}`} to="/invoices">Invoices</NavLink>
          <NavLink className={({ isActive }) => `desktop-link ${isActive ? "active" : ""}`} to="/create-invoice">Create</NavLink>
          <NavLink className={({ isActive }) => `desktop-link ${isActive ? "active" : ""}`} to="/ledger">Ledger</NavLink>
          <NavLink className={({ isActive }) => `desktop-link ${isActive ? "active" : ""}`} to="/payments">Payments</NavLink>
          {role === "super_admin" && (
            <>
              <NavLink className={({ isActive }) => `desktop-link ${isActive ? "active" : ""}`} to="/parties">Parties</NavLink>
              <NavLink className={({ isActive }) => `desktop-link ${isActive ? "active" : ""}`} to="/firms">Firms</NavLink>
            </>
          )}
        </nav>
        <button className="secondary" onClick={handleLogout}>Log Out</button>
      </header>

      {/* Mobile Top Header */}
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
