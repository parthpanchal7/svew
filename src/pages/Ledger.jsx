import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function getFYDates(fy) {
  if (!fy) return null;

  const startYear = "20" + fy.slice(0, 2);
  const endYear = "20" + fy.slice(2, 4);

  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`,
  };
}

export default function Ledger() {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState("");
  const [ledger, setLedger] = useState([]);
  const [financialYear, setFinancialYear] = useState("");

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    const { data } = await supabase.from("parties").select("*");
    setParties(data || []);
  };

  const fetchLedger = async (partyId) => {
    if (!partyId) return;

    // Fetch invoices
    let invoiceQuery = supabase
      .from("invoices")
      .select("invoice_date, invoice_number, grand_total, financial_year")
      .eq("party_id", partyId);

    if (financialYear) {
      invoiceQuery = invoiceQuery.eq("financial_year", financialYear);
    }

    const { data: invoices } = await invoiceQuery;

    // Fetch payments
    let paymentQuery = supabase
      .from("payments_in")
      .select("payment_date, reference_no, amount")
      .eq("party_id", partyId);

    const fyDates = getFYDates(financialYear);

    if (fyDates) {
      paymentQuery = paymentQuery
        .gte("payment_date", fyDates.start)
        .lte("payment_date", fyDates.end);
    }

    const { data: payments } = await paymentQuery;

    const invoiceEntries = (invoices || []).map((inv) => ({
      date: inv.invoice_date,
      type: "Invoice",
      ref: inv.invoice_number,
      debit: Number(inv.grand_total),
      credit: 0,
    }));

    const paymentEntries = (payments || []).map((p) => ({
      date: p.payment_date,
      type: "Payment",
      ref: p.reference_no,
      debit: 0,
      credit: Number(p.amount),
    }));

    let merged = [...invoiceEntries, ...paymentEntries];

    // Sort by date
    merged.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let balance = 0;

    merged = merged.map((entry) => {
      balance += entry.debit;
      balance -= entry.credit;

      return {
        ...entry,
        balance,
      };
    });

    setLedger(merged);
  };

  const fmt = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const exportPDF = () => {
    if (!selectedParty) {
      alert("Select party first");
      return;
    }

    const party = parties.find((p) => p.id === selectedParty);

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Account Statement", 14, 15);

    doc.setFontSize(11);
    doc.text(`Party: ${party.party_name}`, 14, 25);

    const tableData = ledger.map((l) => [
      l.date,
      l.type,
      l.ref,
      l.debit
        ? "₹ " +
          Number(l.debit).toLocaleString("en-IN", { minimumFractionDigits: 2 })
        : "",
      l.credit
        ? "₹ " +
          Number(l.credit).toLocaleString("en-IN", { minimumFractionDigits: 2 })
        : "",
      "₹ " +
        Number(l.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
    ]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    autoTable(doc, {
      startY: 35,
      head: [["Date", "Type", "Reference", "Debit", "Credit", "Balance"]],
      body: tableData,
      styles: { font: "helvetica", fontSize: 10 },
      columnStyles: {
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    });

    doc.save("ledger.pdf");
  };

  return (
    <div className="page-card">
      <h2>Party Ledger</h2>
      <div className="grid-2">
        <div className="field">
          <label>Financial Year</label>

          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
          >
            <option value="">All Years</option>
            <option value="2526">2025-26</option>
            <option value="2425">2024-25</option>
            <option value="2324">2023-24</option>
          </select>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Select Party</label>
          <select
            value={selectedParty}
            onChange={(e) => {
              setSelectedParty(e.target.value);
              fetchLedger(e.target.value);
            }}
          >
            <option value="">Select Party</option>

            {parties.map((party) => (
              <option key={party.id} value={party.id}>
                {party.party_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <br />

      <button onClick={exportPDF}>Export PDF</button>

      <hr />

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Reference</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
          </tr>
        </thead>

        <tbody>
          {ledger.map((entry, index) => (
            <tr key={index}>
              <td>{entry.date}</td>

              <td>{entry.type}</td>

              <td>{entry.ref}</td>

              <td className="num">
                {entry.debit ? `₹ ${fmt(entry.debit)}` : ""}
              </td>
              <td className="num">
                {entry.credit ? `₹ ${fmt(entry.credit)}` : ""}
              </td>
              <td className="num">{`₹ ${fmt(entry.balance)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
