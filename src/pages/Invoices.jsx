import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        firms (firm_name),
        parties (party_name)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setInvoices(data || []);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this invoice?");
    if (!confirmDelete) return;

    await supabase.from("invoices").delete().eq("id", id);

    fetchInvoices();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Invoices</h2>

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Firm</th>
            <th>Party</th>
            <th>Total</th>
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
              <td>{inv.grand_total}</td>
              <td>
                <Link to={`/edit-invoice/${inv.id}`}>Edit</Link>
              </td>
              <td>
                <Link to={`/view-invoice/${inv.id}`}>View</Link>
              </td>
              <td>
                <button onClick={() => handleDelete(inv.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
