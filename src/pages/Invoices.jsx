/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);

  async function fetchInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select(`*, firms (firm_name), parties (party_name)`)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }
    setInvoices(data || []);
  }

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this invoice?");
    if (!confirmDelete) return;
    await supabase.from("invoices").delete().eq("id", id);
    fetchInvoices();
  };

  return (
    <section className="page-card">
      <h2 className="page-title">Invoices</h2>
      <p className="muted">Track all generated invoices and perform quick actions.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Invoice No</th><th>Date</th><th>Firm</th><th>Party</th><th>Total</th><th colSpan={3}>Action</th></tr></thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.invoice_number}</td><td>{inv.invoice_date}</td><td>{inv.firms?.firm_name}</td><td>{inv.parties?.party_name}</td><td>{inv.grand_total}</td>
                <td><Link className="nav-link" to={`/edit-invoice/${inv.id}`}>Edit</Link></td>
                <td><Link className="nav-link" to={`/view-invoice/${inv.id}`}>View</Link></td>
                <td><button className="secondary" onClick={() => handleDelete(inv.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
