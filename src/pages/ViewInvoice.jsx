/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

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
    const { data: itemData } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);
    setInvoice(data);
    setItems(itemData || []);
  }

  useEffect(() => {
    fetchInvoice();
  }, [id]);

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

  function numberToWordsIndian(num) {
    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if ((num = num.toString()).length > 9) return "Overflow";

    const n = ("000000000" + num)
      .substr(-9)
      .match(/(\d{2})(\d{2})(\d{2})(\d{3})/);
    if (!n) return "";

    let str = "";
    str +=
      Number(n[1]) !== 0
        ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + " Crore "
        : "";

    str +=
      Number(n[2]) !== 0
        ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + " Lakh "
        : "";

    str +=
      Number(n[3]) !== 0
        ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + " Thousand "
        : "";

    str +=
      Number(n[4]) !== 0
        ? a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]
        : "";

    return str.trim() + " Only";
  }

  const amountInWords = numberToWordsIndian(
    Math.round(invoice.grand_total || 0),
  );

  return (
    <section className="page-card invoice-document">
      {/* ================= HEADER ================= */}
      <header className="invoice-header">
        <div className="invoice-company-block">
          <p className="invoice-eyebrow">Tax Invoice</p>
          <h2 className="invoice-company">{invoice.firms?.firm_name}</h2>
          <p className="invoice-text">{invoice.firms?.address}</p>
          <p className="invoice-text">GSTIN: {invoice.firms?.gst_number}</p>
        </div>
      </header>

      {/* ================= BILL TO ================= */}
      <section className="invoice-party-grid">
        <article className="invoice-party-card">
          <p className="invoice-label">Billed To</p>
          <h3>{invoice.parties?.party_name}</h3>
          <p className="invoice-text">{invoice.parties?.address}</p>
          <p className="invoice-text">GSTIN: {invoice.parties?.gst_number}</p>
          <p className="invoice-text">State: {invoice.parties?.state}</p>
        </article>

        <article className="invoice-party-card">
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
              <strong>{invoice.financial_year}</strong>
            </div>
          </div>
        </article>
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

      {/* ================= TOTALS SECTION ================= */}
      <section className="invoice-totals-row">
        <div className="invoice-left-section">
          <div className="invoice-note-box">
            <p className="invoice-label">Amount in Words</p>
            <p className="invoice-text">Rs. {amountInWords}</p>
          </div>

          <div className="invoice-note-box">
            <p className="invoice-label">Terms & Conditions</p>
            <p className="invoice-text">
              (1) Our responsibility ceases when goods are delivered.
            </p>
            <p className="invoice-text">
              (2) Payment by A/c Payee Cheque preferred.
            </p>
            <p className="invoice-text">
              (3) Subject to Ahmedabad Jurisdiction.
            </p>
          </div>

          <div className="invoice-party-card">
            <p className="invoice-label">Bank Details</p>
            <p className="invoice-text">Bank: {invoice.firms?.bank_name}</p>
            <p className="invoice-text">
              A/C No: {invoice.firms?.account_number}
            </p>
            <p className="invoice-text">IFSC: {invoice.firms?.ifsc_code}</p>
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

      {/* ================= FOOTER ================= */}
      <footer className="invoice-footer">
        <p className="invoice-text">This is a computer generated invoice.</p>

        <div className="invoice-signature">
          <p>For {invoice.firms?.firm_name}</p>
          <div className="sign-line" />
          <p className="invoice-text">Authorized Signatory</p>
        </div>
      </footer>

      <div className="invoice-dev-footer">
        <p>
          Invoice system developed by{" "}
          <a href="https://your-portfolio-link.com" target="_blank">
            Parth Panchal
          </a>
        </p>
      </div>

      <button className="no-print" onClick={() => window.print()}>
        Print Invoice
      </button>
    </section>
  );
}
