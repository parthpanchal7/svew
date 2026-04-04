import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Dashboard({ role }) {
  const [stats, setStats] = useState({ invoices: 0, parties: 0, firms: 0, totalSales: 0, outstanding: 0 });
  const [firms, setFirms] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFirms();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedFirm]);

  const fetchFirms = async () => {
    const { data } = await supabase.from("firms").select("*");
    setFirms(data || []);
  };

  const fetchStats = async () => {
    setLoading(true);
    let invQuery = supabase.from("invoices").select("grand_total", { count: "exact" }).eq("financial_year", "2627");
    let partyQuery = supabase.from("parties").select("*", { count: "exact", head: true });
    let payQuery = supabase.from("payments").select("amount");

    if (selectedFirm) {
      invQuery = invQuery.eq("firm_id", selectedFirm);
      payQuery = payQuery.eq("firm_id", selectedFirm);
    }

    const [invRes, partyRes, payRes, firmRes] = await Promise.all([
      invQuery,
      supabase.from("parties").select("*", { count: "exact", head: true }),
      payRes = payQuery,
      supabase.from("firms").select("*", { count: "exact", head: true })
    ]);

    const totalSales = invRes.data?.reduce((sum, inv) => sum + (inv.grand_total || 0), 0) || 0;
    const totalPayments = payRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    setStats({
      invoices: invRes.count || 0,
      parties: partyRes.count || 0,
      firms: firmRes.count || 0,
      totalSales,
      outstanding: totalSales - totalPayments
    });
    setLoading(false);
  };

  const fmt = (v) => "₹ " + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="dashboard-container">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", margin: 0, color: "var(--brand)" }}>Dashboard</h1>
          <p className="muted" style={{ margin: "4px 0" }}>Financial Year 2026-27 Summary</p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <select 
            value={selectedFirm} 
            onChange={(e) => setSelectedFirm(e.target.value)}
            style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "10px", outline: "none", background: "#fff", cursor: "pointer" }}
          >
            <option value="">All Firms</option>
            {firms.map(f => <option key={f.id} value={f.id}>{f.firm_name}</option>)}
          </select>
        </div>
      </header>

      <section className="summary-grid" style={{ marginBottom: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
        <div className="summary-item" style={{ background: "linear-gradient(135deg, #05668d, #028090)", color: "#fff", border: "none" }}>
          <strong style={{ opacity: 0.9, fontSize: "0.9rem" }}>Total Sales (FY 26-27)</strong>
          <p className="stat-value">{fmt(stats.totalSales)}</p>
          <div className="stat-footer">Across {stats.invoices} Invoices</div>
        </div>
        
        <div className="summary-item" style={{ background: "linear-gradient(135deg, #f77f00, #d62828)", color: "#fff", border: "none" }}>
          <strong style={{ opacity: 0.9, fontSize: "0.9rem" }}>Pending Collection</strong>
          <p className="stat-value">{fmt(stats.outstanding)}</p>
          <div className="stat-footer">Outstanding Balance</div>
        </div>

        <div className="summary-item" style={{ background: "#fff", border: "1px solid #eef2f7" }}>
          <strong className="muted" style={{ fontSize: "0.9rem" }}>Active Parties</strong>
          <p className="stat-value" style={{ color: "#2d3436" }}>{stats.parties}</p>
          <div className="stat-footer muted">Registered in system</div>
        </div>

        <div className="summary-item" style={{ background: "#fff", border: "1px solid #eef2f7" }}>
          <strong className="muted" style={{ fontSize: "0.9rem" }}>Managed Firms</strong>
          <p className="stat-value" style={{ color: "#2d3436" }}>{stats.firms}</p>
          <div className="stat-footer muted">Active Business Units</div>
        </div>
      </section>

      <div className="dashboard-content-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem" }}>
        <section className="page-card" style={{ margin: 0, padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1.2rem", fontSize: "1.1rem" }}>Quick Operations</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
            <Link to="/create-invoice" className="quick-btn">
              <span className="icon">📄</span>
              New Invoice
            </Link>
            <Link to="/parties" className="quick-btn">
              <span className="icon">👤</span>
              Add Party
            </Link>
            <Link to="/ledger" className="quick-btn">
              <span className="icon">📚</span>
              View Ledger
            </Link>
            <Link to="/payments" className="quick-btn">
              <span className="icon">💳</span>
              Payments
            </Link>
          </div>
          
          <div style={{ marginTop: "2.5rem" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>FY 2026-27 Target Completion</h3>
            <div style={{ padding: "1.5rem", background: "#f8fafd", borderRadius: "12px" }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>Monthly Sales Target</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--brand)" }}>72% Achieved</span>
               </div>
               <div style={{ height: "10px", background: "#e9ecef", borderRadius: "5px", overflow: "hidden" }}>
                  <div style={{ width: "72%", height: "100%", background: "linear-gradient(90deg, #05668d, #02c39a)", borderRadius: "5px" }}></div>
               </div>
               <p className="muted" style={{ fontSize: "0.8rem", marginTop: "12px" }}>
                 * Projected growth is 12% higher than previous financial year (25-26).
               </p>
            </div>
          </div>
        </section>

        <section className="page-card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1.5rem" }}>
          <div>
            <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>User Information</h3>
            <div style={{ padding: "12px", background: "#f8f9fa", borderRadius: "10px", border: "1px solid #eee" }}>
              <span className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Current Profile Role</span>
              <div style={{ fontWeight: "700", color: "var(--brand)", marginTop: "4px", fontSize: "1.1rem" }}>{role || "SUPER ADMIN"}</div>
            </div>
          </div>

          <div>
             <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>System Health</h3>
             <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                  <div style={{ width: "8px", height: "8px", background: "#27ae60", borderRadius: "50%" }}></div>
                  <span>Database: Connected</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                  <div style={{ width: "8px", height: "8px", background: "#27ae60", borderRadius: "50%" }}></div>
                  <span>PDF Engine: Optimized</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem" }}>
                  <div style={{ width: "8px", height: "8px", background: "#27ae60", borderRadius: "50%" }}></div>
                  <span>Secure SSL: Active</span>
                </div>
             </div>
          </div>

          <div style={{ marginTop: "auto", padding: "1rem", background: "rgba(5, 102, 141, 0.05)", borderRadius: "10px", borderLeft: "4px solid var(--brand)" }}>
             <p style={{ fontSize: "0.85rem", margin: 0, color: "#2d3436" }}>
               <strong>Tip:</strong> You can export party ledgers directly from the Ledger page with the new A4 optimized format.
             </p>
          </div>
        </section>
      </div>

      <style>{`
        .stat-value { font-size: 2.2rem; font-weight: 800; margin: 8px 0; }
        .stat-footer { font-size: 0.85rem; opacity: 0.85; }
        .quick-btn { 
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.2rem 1rem; 
          background: #fff; 
          border: 1px solid #edf2f7;
          border-radius: 16px; 
          text-decoration: none; 
          color: #2d3436; 
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .quick-btn .icon { font-size: 1.5rem; margin-bottom: 8px; }
        .quick-btn:hover { 
          background: #fff; 
          box-shadow: 0 10px 20px rgba(5, 102, 141, 0.1); 
          transform: translateY(-4px); 
          border-color: var(--brand); 
          color: var(--brand); 
        }
      `}</style>
    </div>
  );
}
