import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getFinancialYear } from "../utils/invoiceNumber";

export default function CreateInvoice() {
  const [firms, setFirms] = useState([]);
  const [parties, setParties] = useState([]);

  const [selectedFirm, setSelectedFirm] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [gstPercent, setGstPercent] = useState(18);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [financialYear, setFinancialYear] = useState("");

  const [items, setItems] = useState([
    {
      sr_no: 1,
      challan_no: "",
      challan_date: "",
      description: "",
      qty: 0,
      rate: 0,
      amount: 0,
    },
  ]);

  useEffect(() => {
    fetchFirms();
    fetchParties();
  }, []);

  useEffect(() => {
    if (selectedFirm && invoiceDate) {
      autoGenerateInvoiceNumber();
    }
  }, [selectedFirm, invoiceDate]);

  async function fetchFirms() {
    const { data } = await supabase.from("firms").select("*");
    setFirms(data || []);
  };

  async function fetchParties() {
    const { data } = await supabase.from("parties").select("*");
    setParties(data || []);
  };

  async function autoGenerateInvoiceNumber() {
    if (!selectedFirm || !invoiceDate) return;

    const fy = getFinancialYear(invoiceDate);

    const { data, error } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("firm_id", selectedFirm)
      .eq("financial_year", fy)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.log(error);
      return;
    }

    let nextNumber = 1;

    if (data && data.length > 0) {
      const lastInvoice = data[0].invoice_number;
      const lastNumber = parseInt(lastInvoice.split("/")[1]);
      nextNumber = lastNumber + 1;
    }

    const formattedNumber = String(nextNumber).padStart(2, "0");

    setInvoiceNumber(`${fy}/${formattedNumber}`);
    setFinancialYear(fy);
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === "qty" || field === "rate") {
      updated[index].amount = Number(updated[index].qty) * Number(updated[index].rate);
    }

    setItems(updated);
  };

  const addRow = () => {
    setItems([
      ...items,
      {
        sr_no: items.length + 1,
        challan_no: "",
        challan_date: "",
        description: "",
        qty: 0,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const gstAmount = (subtotal * gstPercent) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const totalBeforeRound = subtotal + gstAmount;
  const roundedTotal = Math.round(totalBeforeRound);
  const roundOff = roundedTotal - totalBeforeRound;

  const handleSaveInvoice = async () => {
    if (!selectedFirm || !selectedParty || !invoiceDate || !invoiceNumber) {
      alert("Fill required fields");
      return;
    }

    try {
      const { data: invoiceData, error } = await supabase
        .from("invoices")
        .insert([
          {
            invoice_number: invoiceNumber,
            financial_year: financialYear,
            firm_id: selectedFirm,
            party_id: selectedParty,
            invoice_date: invoiceDate,
            gst_percent: gstPercent,
            subtotal,
            cgst,
            sgst,
            total_before_round: totalBeforeRound,
            round_off: roundOff,
            grand_total: roundedTotal,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const invoiceId = invoiceData.id;

      const itemsToInsert = items.map((item) => ({
        invoice_id: invoiceId,
        sr_no: item.sr_no,
        challan_no: item.challan_no,
        challan_date: item.challan_date,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        amount: item.amount,
      }));

      const { error: itemError } = await supabase.from("invoice_items").insert(itemsToInsert);

      if (itemError) throw itemError;

      alert(`Invoice ${invoiceNumber} saved successfully`);

      setSelectedFirm("");
      setSelectedParty("");
      setInvoiceDate("");
      setInvoiceNumber("");
      setFinancialYear("");
      setItems([
        {
          sr_no: 1,
          challan_no: "",
          challan_date: "",
          description: "",
          qty: 0,
          rate: 0,
          amount: 0,
        },
      ]);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section className="page-card">
      <h2 className="page-title">Create Invoice</h2>

      <div className="grid-2">
        <div className="field">
          <label>Invoice Date</label>
          <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </div>

        <div className="field">
          <label>Invoice Number</label>
          <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </div>

        <div className="field">
          <label>Firm</label>
          <select value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
            <option value="">Select Firm</option>
            {firms.map((firm) => (
              <option key={firm.id} value={firm.id}>
                {firm.firm_name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Party</label>
          <select value={selectedParty} onChange={(e) => setSelectedParty(e.target.value)}>
            <option value="">Select Party</option>
            {parties.map((party) => (
              <option key={party.id} value={party.id}>
                {party.party_name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>GST %</label>
          <input type="number" value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))} />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sr</th>
              <th>Challan No</th>
              <th>Date</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.sr_no}</td>
                <td>
                  <input value={item.challan_no} onChange={(e) => handleItemChange(index, "challan_no", e.target.value)} />
                </td>
                <td>
                  <input type="date" value={item.challan_date} onChange={(e) => handleItemChange(index, "challan_date", e.target.value)} />
                </td>
                <td>
                  <input value={item.description} onChange={(e) => handleItemChange(index, "description", e.target.value)} />
                </td>
                <td>
                  <input type="number" value={item.qty} onChange={(e) => handleItemChange(index, "qty", e.target.value)} />
                </td>
                <td>
                  <input type="number" value={item.rate} onChange={(e) => handleItemChange(index, "rate", e.target.value)} />
                </td>
                <td>{item.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
        <button className="secondary" onClick={addRow}>
          Add Row
        </button>
        <button onClick={handleSaveInvoice}>Save Invoice</button>
      </div>

      <div className="summary-grid">
        <div className="summary-item">Subtotal: {subtotal.toFixed(2)}</div>
        <div className="summary-item">CGST: {cgst.toFixed(2)}</div>
        <div className="summary-item">SGST: {sgst.toFixed(2)}</div>
        <div className="summary-item">Total Before Round: {totalBeforeRound.toFixed(2)}</div>
        <div className="summary-item">Round Off: {roundOff.toFixed(2)}</div>
        <div className="summary-item">Grand Total: {roundedTotal.toFixed(2)}</div>
      </div>
    </section>
  );
}
