export default function Dashboard({ role }) {
  return (
    <section className="page-card">
      <h2 className="page-title">Dashboard</h2>
      <div className="summary-grid">
        <div className="summary-item">
          <strong>Role</strong>
          <p className="muted">{role || "Unknown"}</p>
        </div>
        <div className="summary-item">
          <strong>Quick Start</strong>
          <p className="muted">Create invoices and manage masters from navigation.</p>
        </div>
      </div>
    </section>
  );
}
