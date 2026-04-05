import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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
  const [firms, setFirms] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [ledger, setLedger] = useState({ openingBalance: 0, entries: [], closingBalance: 0 });
  const [financialYear, setFinancialYear] = useState("2627");

  useEffect(() => {
    fetchParties();
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    const { data } = await supabase.from("firms").select("*");
    setFirms(data || []);
  };

  const fetchParties = async () => {
    const { data } = await supabase.from("parties").select("*");
    setParties(data || []);
  };

  const fetchLedger = async (partyId, firmId) => {
    if (!partyId || !firmId) return;

    // 1. Fetch EVERYTHING for this party AND firm
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("invoice_date, invoice_number, grand_total, financial_year")
      .eq("party_id", partyId)
      .eq("firm_id", firmId);

    const { data: allPayments } = await supabase
      .from("payments_in")
      .select("payment_date, reference_no, amount")
      .eq("party_id", partyId);
    // Note: If you want payments to be firm-specific too, you'll need firm_id in payments_in table.
    // For now, payments are party-specific.

    const fyDates = getFYDates(financialYear);

    // 2. Separate into Opening Balance and Current Ledger
    let openingBalance = 0;
    const currentInvoiceEntries = [];
    const currentPaymentEntries = [];

    if (fyDates) {
      allInvoices?.forEach((inv) => {
        if (new Date(inv.invoice_date) < new Date(fyDates.start)) {
          openingBalance += Number(inv.grand_total);
        } else if (new Date(inv.invoice_date) <= new Date(fyDates.end)) {
          currentInvoiceEntries.push({
            date: inv.invoice_date,
            type: "Invoice",
            ref: inv.invoice_number,
            debit: Number(inv.grand_total),
            credit: 0,
          });
        }
      });

      allPayments?.forEach((p) => {
        if (new Date(p.payment_date) < new Date(fyDates.start)) {
          openingBalance -= Number(p.amount);
        } else if (new Date(p.payment_date) <= new Date(fyDates.end)) {
          currentPaymentEntries.push({
            date: p.payment_date,
            type: "Payment",
            ref: p.reference_no,
            debit: 0,
            credit: Number(p.amount),
          });
        }
      });
    } else {
      // All years
      allInvoices?.forEach((inv) => {
        currentInvoiceEntries.push({
          date: inv.invoice_date,
          type: "Invoice",
          ref: inv.invoice_number,
          debit: Number(inv.grand_total),
          credit: 0,
        });
      });
      allPayments?.forEach((p) => {
        currentPaymentEntries.push({
          date: p.payment_date,
          type: "Payment",
          ref: p.reference_no,
          debit: 0,
          credit: Number(p.amount),
        });
      });
    }

    let merged = [...currentInvoiceEntries, ...currentPaymentEntries];
    merged.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3. Calculate running balance starting from openingBalance
    let balance = openingBalance;
    const finalLedger = merged.map((entry) => {
      balance += entry.debit;
      balance -= entry.credit;
      return { ...entry, balance };
    });

    setLedger({
      openingBalance,
      entries: finalLedger,
      closingBalance: balance,
    });
  };

  const handlePrint = () => {
    if (!selectedParty) {
      alert("Select party first");
      return;
    }
    window.print();
  };

  const party = parties.find((p) => p.id === selectedParty);
  const firm = firms.find((f) => f.id === selectedFirm);

  return (
    <div className="page-card">
      <div className="no-print">
        <h2 className="page-title">Party Ledger</h2>
        <div className="grid-2">
          <div className="field">
            <label>Financial Year</label>
            <select value={financialYear} onChange={(e) => {
              setFinancialYear(e.target.value);
              if (selectedParty && selectedFirm) fetchLedger(selectedParty, selectedFirm);
            }}>
              <option value="">All Years</option>
              <option value="2627">2026-27 (Upcoming)</option>
              <option value="2526">2025-26</option>
              <option value="2425">2024-25</option>
              <option value="2324">2023-24</option>
            </select>
          </div>
          <div className="field">
            <label>Select Firm</label>
            <select
              value={selectedFirm}
              onChange={(e) => {
                const firmId = e.target.value;
                setSelectedFirm(firmId);
                if (selectedParty && firmId) {
                  fetchLedger(selectedParty, firmId);
                } else {
                  setLedger({ openingBalance: 0, entries: [], closingBalance: 0 });
                }
              }}
            >
              <option value="">Select Firm</option>
              {firms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.firm_name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Select Party</label>
            <select
              value={selectedParty}
              onChange={(e) => {
                const partyId = e.target.value;
                setSelectedParty(partyId);
                if (partyId && selectedFirm) {
                  fetchLedger(partyId, selectedFirm);
                } else {
                  setLedger({ openingBalance: 0, entries: [], closingBalance: 0 });
                }
              }}
            >
              <option value="">Select Party</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.party_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <button onClick={handlePrint} disabled={!selectedParty || !selectedFirm}>
            Export PDF / Print
          </button>
        </div>
        <hr />
      </div>

      {!selectedParty || !selectedFirm ? (
        <p className="muted">Please select both a Firm and a Party to view the ledger.</p>
      ) : (
        <div className="invoice-document ledger-document ledger-print-container">
          <header className="invoice-header" style={{ marginBottom: "0.2rem", paddingBottom: "0.5rem" }}>
            <div className="invoice-company-block">
              <p className="invoice-eyebrow">Account Statement</p>
              <h2 className="invoice-company" style={{ color: "var(--brand)", marginBottom: "0.1rem" }}>{firm?.firm_name}</h2>
              <p className="invoice-text" style={{ fontSize: "0.95rem", fontWeight: "bold" }}>Party: {party?.party_name}</p>
              <p className="invoice-text">{party?.address}</p>
              <p className="invoice-text">GSTIN: {party?.gst_number || "-"}</p>
            </div>
            <div className="invoice-meta-block" style={{ minWidth: "180px" }}>
              <div>
                <span>Statement Period</span>
                <strong>
                  {financialYear
                    ? `FY 20${financialYear.slice(0, 2)}-${financialYear.slice(2, 4)}`
                    : "All Time"}
                </strong>
              </div>
            </div>
          </header>

          <div className="invoice-items-wrap" style={{ marginTop: "0.2rem" }}>
            <div className="table-wrap">
              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reference</th>
                    <th className="num">Debit</th>
                    <th className="num">Credit</th>
                    <th className="num">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {financialYear && (
                    <tr style={{ background: "#f8fbff", fontWeight: 600 }}>
                      <td colSpan={5} style={{ textAlign: "right" }}>
                        Opening Balance
                      </td>
                      <td className="num">{fmt(ledger.openingBalance)}</td>
                    </tr>
                  )}

                  {ledger.entries?.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.date}</td>
                      <td>{entry.type}</td>
                      <td>{entry.ref}</td>
                      <td className="num">{entry.debit ? fmt(entry.debit) : ""}</td>
                      <td className="num">{entry.credit ? fmt(entry.credit) : ""}</td>
                      <td className="num">{fmt(entry.balance)}</td>
                    </tr>
                  ))}

                  <tr className="total-tile" style={{ borderTop: "2px solid var(--line)" }}>
                    <td colSpan={5} style={{ textAlign: "right" }}>
                      <strong>Closing Balance</strong>
                    </td>
                    <td className="num">
                      <strong>₹ {fmt(ledger.closingBalance)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <footer className="invoice-footer">
            <p className="invoice-text">Generated via SVEW Billing System</p>
            <div className="invoice-signature">
              <div className="sign-line" />
              <p className="invoice-text">Accountant / Manager</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
