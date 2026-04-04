/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [financialYear, setFinancialYear] = useState("2627");

  const fetchInvoices = async () => {
    let query = supabase
      .from("invoices")
      .select(`*, firms (firm_name), parties (party_name)`)
      .order("created_at", { ascending: false });

    if (financialYear) {
      query = query.eq("financial_year", financialYear);
    }

    const { data, error } = await query;

    if (error) {
      console.log(error);
      return;
    }
    setInvoices(data || []);
  };

  useEffect(() => {
    fetchInvoices();
  }, [financialYear]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this invoice?");
    if (!confirmDelete) return;
    await supabase.from("invoices").delete().eq("id", id);
    fetchInvoices();
  };

  const fmt = (val) => Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  return (
    <section className="page-card">
      <div className="no-print">
        <h2 className="page-title">Invoices</h2>
        <div className="grid-2">
          <div className="field">
            <label>Filter by Financial Year</label>
            <select value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
              <option value="">All Years</option>
              <option value="2627">2026-27</option>
              <option value="2526">2025-26</option>
              <option value="2425">2024-25</option>
              <option value="2324">2023-24</option>
            </select>
          </div>
        </div>
        <br />
        <p className="muted">Track all generated invoices and perform quick actions.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Firm</th>
                <th>Party</th>
                <th className="num">Total</th>
                <th colSpan={3}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoice_number}</td>
                  <td>{inv.invoice_date}</td>
                  <td>{inv.firms?.firm_name}</td>
                  <td>{inv.parties?.party_name}</td>
                  <td className="num">₹ {fmt(inv.grand_total)}</td>
                  <td>
                    <Link className="nav-link" to={`/edit-invoice/${inv.id}`}>
                      Edit
                    </Link>
                  </td>
                  <td>
                    <Link className="nav-link" to={`/view-invoice/${inv.id}`}>
                      View
                    </Link>
                  </td>
                  <td>
                    <button className="secondary" onClick={() => handleDelete(inv.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
