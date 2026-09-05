/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getFinancialYear } from "../utils/invoiceNumber";

export default function InvoiceForm({ initialData = null, onSubmit }) {
  const [firms, setFirms] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [gstPercent, setGstPercent] = useState(18);
  const [referenceNote, setReferenceNote] = useState("");
  const [items, setItems] = useState([{ sr_no: 1, challan_no: "", challan_date: "", description: "", item_note: "", qty: 0, rate: 0, amount: 0 }]);
  const [productsList, setProductsList] = useState([]);

  async function fetchFirms() {
    const { data } = await supabase.from("firms").select("*");
    setFirms(data || []);
  }

  async function fetchParties() {
    const { data } = await supabase.from("parties").select("*");
    setParties(data || []);
  }

  async function fetchProducts() {
    const productMap = new Map();

    // 1. Load from products master table
    const { data: masterData } = await supabase
      .from("products")
      .select("description, rate, item_note")
      .order("description", { ascending: true });

    if (masterData) {
      masterData.forEach((item) => {
        const name = item.description?.trim();
        if (name) {
          productMap.set(name.toLowerCase(), {
            description: name,
            rate: item.rate || 0,
            item_note: item.item_note || "",
          });
        }
      });
    }

    // 2. Load from invoice_items history
    const { data: historyData } = await supabase
      .from("invoice_items")
      .select("id, description, rate, item_note")
      .not("description", "is", null)
      .order("id", { ascending: true });

    if (historyData) {
      historyData.forEach((item) => {
        const name = item.description?.trim();
        if (name && !productMap.has(name.toLowerCase())) {
          productMap.set(name.toLowerCase(), {
            description: name,
            rate: item.rate || 0,
            item_note: item.item_note || "",
          });
        }
      });
    }

    setProductsList(Array.from(productMap.values()));
  }

  useEffect(() => {
    fetchFirms();
    fetchParties();
    fetchProducts();

    if (initialData) {
      setSelectedFirm(initialData.firm_id);
      setSelectedParty(initialData.party_id);
      setInvoiceDate(initialData.invoice_date);
      setInvoiceNumber(initialData.invoice_number);
      setFinancialYear(initialData.financial_year);
      setGstPercent(initialData.gst_percent || 18);
      setReferenceNote(initialData.reference_note || "");
      setItems(initialData.items || []);
    }
  }, [initialData]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === "description") {
      const match = productsList.find(
        (p) => p.description.toLowerCase() === value.trim().toLowerCase()
      );
      if (match) {
        if (match.rate) {
          updated[index].rate = match.rate;
        }
        if (match.item_note && !updated[index].item_note) {
          updated[index].item_note = match.item_note;
        }
      }
    }

    if (field === "qty" || field === "rate" || field === "description") {
      updated[index].amount = Number(updated[index].qty || 0) * Number(updated[index].rate || 0);
    }

    setItems(updated);
  };

  const addRow = () => setItems([...items, { sr_no: items.length + 1, challan_no: "", challan_date: "", description: "", item_note: "", qty: 0, rate: 0, amount: 0 }]);

  const removeRow = (indexToRemove) => {
    if (items.length === 1) return;
    const filtered = items.filter((_, index) => index !== indexToRemove);
    const reIndexed = filtered.map((item, i) => ({ ...item, sr_no: i + 1 }));
    setItems(reIndexed);
  };

  const subtotal = Number(items.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2));
  const gstAmount = Number(((subtotal * (Number(gstPercent) || 0)) / 100).toFixed(2));
  const cgst = Number((gstAmount / 2).toFixed(2));
  const sgst = Number((gstAmount / 2).toFixed(2));
  const totalBeforeRound = Number((subtotal + gstAmount).toFixed(2));
  const roundedTotal = Math.round(totalBeforeRound);
  const roundOff = Number((roundedTotal - totalBeforeRound).toFixed(2));

  const handleSubmit = () => {
    if (!selectedFirm || !selectedParty || !invoiceDate || !invoiceNumber) {
      alert("Please fill in all required general & billing details (Firm, Party, Date, Invoice Number).");
      return;
    }

    const validItems = items.filter((item) => item.description && item.description.trim() !== "");
    if (validItems.length === 0) {
      alert("Please add at least one item with a valid product description.");
      return;
    }

    const cleanedItems = validItems.map((item, index) => ({
      ...item,
      sr_no: index + 1,
      description: item.description.trim(),
      qty: Number(item.qty) || 0,
      rate: Number(item.rate) || 0,
      amount: Number((Number(item.qty || 0) * Number(item.rate || 0)).toFixed(2)),
    }));

    onSubmit({
      invoice_number: invoiceNumber,
      financial_year: financialYear || getFinancialYear(invoiceDate),
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
      reference_note: referenceNote || null,
      items: cleanedItems,
    });
  };

  return (
    <section className="page-card">
      <h2 className="page-title">Edit Invoice</h2>
      <div className="grid-2">
        <div className="field"><label>Invoice Date</label><input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div>
        <div className="field"><label>Invoice Number</label><input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} /></div>
        <div className="field"><label>Firm</label><select value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}><option value="">Select Firm</option>{firms.map((f) => <option key={f.id} value={f.id}>{f.firm_name}</option>)}</select></div>
        <div className="field"><label>Party</label><select value={selectedParty} onChange={(e) => setSelectedParty(e.target.value)}><option value="">Select Party</option>{parties.map((p) => <option key={p.id} value={p.id}>{p.party_name}</option>)}</select></div>
        <div className="field" style={{ gridColumn: "span 2" }}><label>Reference Note (Optional)</label><input value={referenceNote} onChange={(e) => setReferenceNote(e.target.value)} placeholder="e.g. Proforma Invoice No. or other references" /></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sr</th>
              <th>Challan</th>
              <th>Date</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.sr_no}</td>
                <td><input value={item.challan_no} onChange={(e) => handleItemChange(index, "challan_no", e.target.value)} /></td>
                <td><input type="date" value={item.challan_date} onChange={(e) => handleItemChange(index, "challan_date", e.target.value)} /></td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <input 
                      value={item.description} 
                      onChange={(e) => handleItemChange(index, "description", e.target.value)} 
                      placeholder="Item name"
                      list="edit-products-autocomplete-list"
                    />
                    <input 
                      value={item.item_note || ""} 
                      onChange={(e) => handleItemChange(index, "item_note", e.target.value)} 
                      placeholder="Optional note / sub-description"
                      style={{ fontSize: "0.85rem", color: "#555", backgroundColor: "#f9fbff", borderStyle: "dashed" }}
                    />
                  </div>
                </td>
                <td><input type="number" value={item.qty} onChange={(e) => handleItemChange(index, "qty", e.target.value)} /></td>
                <td><input type="number" value={item.rate} onChange={(e) => handleItemChange(index, "rate", e.target.value)} /></td>
                <td>{item.amount}</td>
                <td style={{ textAlign: "center" }}>
                  <button 
                    className="secondary" 
                    onClick={() => removeRow(index)} 
                    disabled={items.length === 1}
                    style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", background: items.length === 1 ? "#f1f3f5" : "#ffe3e3", color: items.length === 1 ? "#adb5bd" : "#fa5252", borderColor: "transparent" }}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <datalist id="edit-products-autocomplete-list">
        {productsList.map((p, idx) => (
          <option key={idx} value={p.description}>
            {p.rate ? `₹${p.rate}` : ""}
          </option>
        ))}
      </datalist>
      <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}><button className="secondary" onClick={addRow}>Add Row</button><button onClick={handleSubmit}>Save</button></div>
      <div className="summary-grid"><div className="summary-item">Subtotal: {subtotal.toFixed(2)}</div><div className="summary-item">CGST: {cgst.toFixed(2)}</div><div className="summary-item">SGST: {sgst.toFixed(2)}</div><div className="summary-item">Total Before Round: {totalBeforeRound.toFixed(2)}</div><div className="summary-item">Round Off: {roundOff.toFixed(2)}</div><div className="summary-item">Grand Total: {roundedTotal.toFixed(2)}</div></div>
    </section>
  );
}
