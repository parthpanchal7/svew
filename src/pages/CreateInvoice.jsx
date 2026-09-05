import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getFinancialYear } from "../utils/invoiceNumber";

export default function CreateInvoice() {
  const [firms, setFirms] = useState([]);
  const [parties, setParties] = useState([]);

  const [selectedFirm, setSelectedFirm] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [gstPercent, setGstPercent] = useState(18);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [referenceNote, setReferenceNote] = useState("");

  const [items, setItems] = useState([
    {
      sr_no: 1,
      challan_no: "",
      challan_date: "",
      description: "",
      item_note: "",
      qty: 0,
      rate: 0,
      amount: 0,
    },
  ]);

  const [productsList, setProductsList] = useState([]);

  useEffect(() => {
    fetchFirms();
    fetchParties();
    fetchProducts();
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
      const parts = lastInvoice.split("/");
      const lastPart = parts[parts.length - 1];
      const lastNumber = parseInt(lastPart) || 0;
      nextNumber = lastNumber + 1;
    }

    const formattedNumber = String(nextNumber).padStart(2, "0");

    setInvoiceNumber(`${fy}/${formattedNumber}`);
    setFinancialYear(fy);
  }

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

  const addRow = () => {
    setItems([
      ...items,
      {
        sr_no: items.length + 1,
        challan_no: "",
        challan_date: "",
        description: "",
        item_note: "",
        qty: 0,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeRow = (indexToRemove) => {
    if (items.length === 1) return; // Keep at least one row
    const filtered = items.filter((_, index) => index !== indexToRemove);
    const reIndexed = filtered.map((item, i) => ({ ...item, sr_no: i + 1 }));
    setItems(reIndexed);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = Number(items.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2));
  const gstAmount = Number(((subtotal * (Number(gstPercent) || 0)) / 100).toFixed(2));
  const cgst = Number((gstAmount / 2).toFixed(2));
  const sgst = Number((gstAmount / 2).toFixed(2));
  const totalBeforeRound = Number((subtotal + gstAmount).toFixed(2));
  const roundedTotal = Math.round(totalBeforeRound);
  const roundOff = Number((roundedTotal - totalBeforeRound).toFixed(2));

  const handleSaveInvoice = async () => {
    if (!selectedFirm || !selectedParty || !invoiceDate || !invoiceNumber) {
      alert("Please fill in all required general & billing details (Firm, Party, Date, Invoice Number).");
      return;
    }

    const validItems = items.filter((item) => item.description && item.description.trim() !== "");
    if (validItems.length === 0) {
      alert("Please add at least one item with a valid product description.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

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
            reference_note: referenceNote || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const invoiceId = invoiceData.id;

      const itemsToInsert = validItems.map((item, index) => ({
        invoice_id: invoiceId,
        sr_no: index + 1,
        challan_no: item.challan_no || null,
        challan_date: item.challan_date || null,
        description: item.description.trim(),
        item_note: item.item_note || null,
        qty: Number(item.qty) || 0,
        rate: Number(item.rate) || 0,
        amount: Number((Number(item.qty || 0) * Number(item.rate || 0)).toFixed(2)),
      }));

      const { error: itemError } = await supabase.from("invoice_items").insert(itemsToInsert);

      if (itemError) {
        console.error("Error inserting invoice items:", itemError);
        throw new Error("Invoice main details saved, but item insertion failed: " + itemError.message);
      }

      alert(`Invoice ${invoiceNumber} saved successfully`);

      setSelectedFirm("");
      setSelectedParty("");
      setInvoiceDate(new Date().toISOString().split("T")[0]);
      setInvoiceNumber("");
      setFinancialYear("");
      setReferenceNote("");
      fetchProducts();
      setItems([
        {
          sr_no: 1,
          challan_no: "",
          challan_date: "",
          description: "",
          item_note: "",
          qty: 0,
          rate: 0,
          amount: 0,
        },
      ]);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-card">
      <h2 className="page-title">Create Invoice</h2>

      <div className="invoice-creation-header" style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--brand)", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
          1. General Details
        </h3>
        <div className="grid-2">
          <div className="field">
            <label>Select Firm</label>
            <select value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
              <option value="">Choose your firm...</option>
              {firms.map((firm) => (
                <option key={firm.id} value={firm.id}>
                  {firm.firm_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="field">
              <label>Invoice Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>

            <div className="field">
              <label>Invoice Number</label>
              <input 
                value={invoiceNumber} 
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Auto-generated"
                style={{ fontWeight: "bold", color: "var(--brand)" }}
              />
            </div>
          </div>

          <div className="field" style={{ gridColumn: "span 2" }}>
            <label>Reference Note (Optional)</label>
            <input 
              value={referenceNote} 
              onChange={(e) => setReferenceNote(e.target.value)} 
              placeholder="e.g. Proforma Invoice No. or other references"
            />
          </div>
        </div>
      </div>

      <div className="invoice-billing-section" style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--brand)", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
          2. Billing & Tax
        </h3>
        <div className="grid-2">
          <div className="field">
            <label>Select Party (Billed To)</label>
            <select value={selectedParty} onChange={(e) => setSelectedParty(e.target.value)}>
              <option value="">Choose party...</option>
              {parties.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.party_name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>GST % (Applicable to all items)</label>
            <input type="number" value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--brand)", borderBottom: "1px solid #f0f0f0", paddingBottom: "8px" }}>
        3. Particulars & Items
      </h3>

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
              <th>Action</th>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <input 
                      value={item.description} 
                      onChange={(e) => handleItemChange(index, "description", e.target.value)} 
                      placeholder="Item name"
                      list="products-autocomplete-list"
                    />
                    <input 
                      value={item.item_note || ""} 
                      onChange={(e) => handleItemChange(index, "item_note", e.target.value)} 
                      placeholder="Optional note / sub-description"
                      style={{ fontSize: "0.85rem", color: "#555", backgroundColor: "#f9fbff", borderStyle: "dashed" }}
                    />
                  </div>
                </td>
                <td>
                  <input type="number" value={item.qty} onChange={(e) => handleItemChange(index, "qty", e.target.value)} />
                </td>
                <td>
                  <input type="number" value={item.rate} onChange={(e) => handleItemChange(index, "rate", e.target.value)} />
                </td>
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

      <datalist id="products-autocomplete-list">
        {productsList.map((p, idx) => (
          <option key={idx} value={p.description}>
            {p.rate ? `₹${p.rate}` : ""}
          </option>
        ))}
      </datalist>

      <div style={{ marginTop: "0.8rem", display: "flex", gap: "0.6rem" }}>
        <button className="secondary" onClick={addRow}>
          Add Row
        </button>
        <button onClick={handleSaveInvoice} disabled={isSubmitting}>
          {isSubmitting ? "Saving Invoice..." : "Save Invoice"}
        </button>
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
