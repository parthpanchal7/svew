/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

import toWords from "../utils/numberToWords";
import logo from "../assets/logo_svew.png";

export default function ViewInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);

  async function fetchInvoice() {
    const { data } = await supabase
      .from("invoices")
      .select(`*, firms (*), parties (*)`)
      .eq("id", id)
      .single();
    const { data: itemData } = await supabase.from("invoice_items").select("*").eq("invoice_id", id);
    setInvoice(data);
    setItems(itemData || []);
  }

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  useEffect(() => {
    if (invoice) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("download") === "true") {
        setTimeout(() => {
          const originalTitle = document.title;
          const serialNo = invoice.invoice_number.split('/').pop() || invoice.invoice_number;
          const safePartyName = invoice.parties?.party_name
            ? invoice.parties.party_name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
            : 'Party';
            
          document.title = `${serialNo}_${safePartyName}`;
          
          // Browser will pause execution while print dialog is open
          window.print();
          
          // These run immediately after the user saves the PDF or cancels
          document.title = originalTitle;
          window.close(); // Close the temporary tab silently
        }, 600); // Brief delay ensuring all CSS and images are rendered
      }
    }
  }, [invoice]);

  if (!invoice) return <div className="page-card">Loading...</div>;

  const fmtCurrency = (value) =>
    "₹ " +
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const amountInWords = toWords.convert(invoice.grand_total || 0);

  const handlePrint = () => {
    const originalTitle = document.title;
    
    // Create custom filename like: 01_PartyName
    const serialNo = invoice.invoice_number.split('/').pop() || invoice.invoice_number;
    const safePartyName = invoice.parties?.party_name
      ? invoice.parties.party_name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
      : 'Party';
      
    document.title = `${serialNo}_${safePartyName}`;
    
    window.print();
    
    // Restore original title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <section className="page-card invoice-document">
      {/* ================= HEADER ================= */}
      <header className="invoice-header" style={{ alignItems: "center", borderBottom: "2pt solid var(--brand)" }}>
        <div className="invoice-company-block">
          <p className="invoice-eyebrow">Tax Invoice</p>
          <h2 className="invoice-company" style={{ color: "var(--brand)", fontSize: "1.6rem" }}>{invoice.firms?.firm_name}</h2>
          <p className="invoice-text"><strong>GSTIN:</strong> {invoice.firms?.gst_number}</p>
          <p className="invoice-text" style={{ fontSize: "0.8rem" }}>{invoice.firms?.address}</p>
          <div style={{ marginTop: "2mm", display: "flex", gap: "10mm" }}>
            {invoice.firms?.contact_number && <p className="invoice-text"><strong>Ph:</strong> {invoice.firms?.contact_number}</p>}
            {invoice.firms?.email && <p className="invoice-text"><strong>Email:</strong> {invoice.firms?.email}</p>}
          </div>
        </div>
        <div className="no-print" style={{ marginLeft: "auto", paddingLeft: "1rem" }}>
          <img src={logo} alt="Logo" style={{ height: "60px", objectFit: "contain" }} />
        </div>
      </header>

      {/* ================= BILL TO ================= */}
      <div className="invoice-body">
        <section className="invoice-party-grid">
          <article className="invoice-party-card">
            <p className="invoice-label">Billed To</p>
            <h3>{invoice.parties?.party_name}</h3>
            <p className="invoice-text">{invoice.parties?.address}</p>
            <p className="invoice-text">GSTIN: {invoice.parties?.gst_number}</p>
            <p className="invoice-text">State: {invoice.parties?.state}</p>
          </article>

          <div className="invoice-meta-block">
            <div>
              <span>Invoice No</span>
              <strong>{invoice.invoice_number}</strong>
            </div>
            <div>
              <span>Date</span>
              <strong>{fmtDate(invoice.invoice_date)}</strong>
            </div>
            <div>
              <span>Financial Year</span>
              <strong>20{invoice.financial_year.slice(0, 2)}-{invoice.financial_year.slice(2, 4)}</strong>
            </div>
          </div>
        </section>

        {/* ================= ITEMS ================= */}
        <div className="invoice-items-wrap">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Sr</th>
                <th>Challan</th>
                <th>Date</th>
                <th>Description</th>
                <th className="num">Qty</th>
                <th className="num">Rate</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.sr_no || index + 1}</td>
                  <td>{item.challan_no}</td>
                  <td>{fmtDate(item.challan_date)}</td>
                  <td>{item.description}</td>
                  <td className="num">{item.qty}</td>
                  <td className="num">{fmtCurrency(item.rate)}</td>
                  <td className="num">{fmtCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= TOTALS SECTION ================= */}
      <div className="invoice-bottom">
        <section className="invoice-totals-row">
          <div className="invoice-left-section">
            <div className="invoice-note-box" style={{ marginTop: 0 }}>
              <p className="invoice-label">Amount in Words</p>
              <p className="invoice-text">Rs. {amountInWords}</p>
            </div>
            <div className="invoice-party-card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <p className="invoice-label">Bank Details</p>
                <p className="invoice-text">Bank: {invoice.firms?.bank_name}</p>
                <p className="invoice-text">A/C No: {invoice.firms?.account_number}</p>
                <p className="invoice-text">IFSC: {invoice.firms?.ifsc_code}</p>
              </div>
            </div>
          </div>

          <div className="invoice-totals-box">
            <div>
              <span>Subtotal</span>
              <strong>{fmtCurrency(invoice.subtotal)}</strong>
            </div>
            <div>
              <span>CGST</span>
              <strong>{fmtCurrency(invoice.cgst)}</strong>
            </div>
            <div>
              <span>SGST</span>
              <strong>{fmtCurrency(invoice.sgst)}</strong>
            </div>
            <div>
              <span>Round Off</span>
              <strong>{fmtCurrency(invoice.round_off)}</strong>
            </div>
            <div className="grand-total">
              <span>Grand Total</span>
              <strong>{fmtCurrency(invoice.grand_total)}</strong>
            </div>
          </div>
        </section>

        <div className="invoice-note-box" style={{ marginTop: "1rem" }}>
          <p className="invoice-label">Terms & Conditions</p>
          <p className="invoice-text">
            (1) Our responsibility ceases when goods are delivered. (2) Payment by A/c Payee Cheque preferred. (3) Subject to Ahmedabad Jurisdiction.
          </p>
        </div>

        {/* ================= FOOTER ================= */}
        <footer className="invoice-footer">
          <div className="invoice-signature">
            <p>For {invoice.firms?.firm_name}</p>
            <div className="sign-line" />
            <p className="invoice-text">Authorized Signatory</p>
          </div>
        </footer>

        <div className="invoice-dev-footer">
          <p>
            Invoice system developed by{" "}
            <a href="https://parthpanchal7.netlify.app" target="_blank">
              Parth Panchal
            </a>
          </p>
        </div>
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }} className="no-print">
        <button id="print-btn" className="primary" onClick={handlePrint}>
          Print / Download PDF
        </button>
        <button className="secondary" onClick={() => window.history.back()}>
          Back to List
        </button>
      </div>
    </section>
  );
}
