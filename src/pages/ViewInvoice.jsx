/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ViewInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);

  async function fetchInvoice() {
    const { data } = await supabase.from("invoices").select(`*, firms (*), parties (*)`).eq("id", id).single();
    const { data: itemData } = await supabase.from("invoice_items").select("*").eq("invoice_id", id);
    setInvoice(data);
    setItems(itemData || []);
  }

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  if (!invoice) return <div className="page-card">Loading...</div>;

  return (
    <section className="page-card">
      <h2 className="page-title">Tax Invoice</h2>
      <div className="summary-grid">
        <div className="summary-item"><strong>{invoice.firms.firm_name}</strong><p className="muted">{invoice.firms.address}</p><p className="muted">GSTIN: {invoice.firms.gst_number}</p></div>
        <div className="summary-item"><p><strong>Invoice No:</strong> {invoice.invoice_number}</p><p><strong>Date:</strong> {invoice.invoice_date}</p></div>
        <div className="summary-item"><strong>Bill To</strong><p className="muted">{invoice.parties.party_name}</p><p className="muted">{invoice.parties.address}</p><p className="muted">GST: {invoice.parties.gst_number}</p></div>
      </div>
      <div className="table-wrap"><table><thead><tr><th>Sr</th><th>Challan</th><th>Date</th><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td>{item.sr_no}</td><td>{item.challan_no}</td><td>{item.challan_date}</td><td>{item.description}</td><td>{item.qty}</td><td>{item.rate}</td><td>{item.amount}</td></tr>)}</tbody></table></div>
      <div className="summary-grid"><div className="summary-item">Subtotal: {invoice.subtotal}</div><div className="summary-item">CGST: {invoice.cgst}</div><div className="summary-item">SGST: {invoice.sgst}</div><div className="summary-item">Round Off: {invoice.round_off}</div><div className="summary-item">Total: {invoice.grand_total}</div></div>
      <h4>Bank Details</h4>
      <p className="muted">Bank: {invoice.firms.bank_name}</p>
      <p className="muted">A/C No: {invoice.firms.account_number}</p>
      <p className="muted">IFSC: {invoice.firms.ifsc_code}</p>
      <button className="no-print" onClick={() => window.print()}>Print</button>
    </section>
  );
}
