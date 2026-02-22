import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getFinancialYear } from "../utils/invoiceNumber";

export default function CreateInvoice({ role }) {
  const [firms, setFirms] = useState([]);
  const [parties, setParties] = useState([]);

  const [selectedFirm, setSelectedFirm] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [gstPercent, setGstPercent] = useState(18);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [financialYear, setFinancialYear] = useState("");
//   const [invoiceManuallyEdited, setInvoiceManuallyEdited] = useState(false);

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
    autoGenerateInvoiceNumber()
  }
}, [selectedFirm, invoiceDate])

  const fetchFirms = async () => {
    const { data } = await supabase.from("firms").select("*");
    setFirms(data || []);
  };

  const fetchParties = async () => {
    const { data } = await supabase.from("parties").select("*");
    setParties(data || []);
  };

  // ================= AUTO GENERATE =================

  const autoGenerateInvoiceNumber = async () => {
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
    console.log("Generating invoice for firm:", selectedFirm);
    console.log("Financial Year:", fy);
    console.log("Auto generating invoice...")
  };

  // ================= ITEM HANDLING =================

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === "qty" || field === "rate") {
      updated[index].amount =
        Number(updated[index].qty) * Number(updated[index].rate);
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

  // ================= CALCULATIONS =================

  const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);

  const gstAmount = (subtotal * gstPercent) / 100;
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const totalBeforeRound = subtotal + gstAmount;
  const roundedTotal = Math.round(totalBeforeRound);
  const roundOff = roundedTotal - totalBeforeRound;

  // ================= SAVE =================

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

      const { error: itemError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (itemError) throw itemError;

      alert(`Invoice ${invoiceNumber} saved successfully`);

      // Reset form
      setSelectedFirm("");
      setSelectedParty("");
      setInvoiceDate("");
      setInvoiceNumber("");
      setFinancialYear("");
    //   setInvoiceManuallyEdited(false);
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
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create Invoice</h2>
      <input
        type="date"
        value={invoiceDate}
        onChange={(e) => {
          setInvoiceDate(e.target.value);
        }}
      />

      <br />
      <br />
      <input
  placeholder="Invoice Number"
  value={invoiceNumber}
  onChange={(e) => setInvoiceNumber(e.target.value)}
/>

      <br />
      <br />

      <select
        value={selectedFirm}
        onChange={(e) => setSelectedFirm(e.target.value)}
      >
        <option value="">Select Firm</option>
        {firms.map((firm) => (
          <option key={firm.id} value={firm.id}>
            {firm.firm_name}
          </option>
        ))}
      </select>

      <br />
      <br />

      <select
        value={selectedParty}
        onChange={(e) => setSelectedParty(e.target.value)}
      >
        <option value="">Select Party</option>
        {parties.map((party) => (
          <option key={party.id} value={party.id}>
            {party.party_name}
          </option>
        ))}
      </select>

      <hr />

      <table border="1" cellPadding="5">
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
                <input
                  value={item.challan_no}
                  onChange={(e) =>
                    handleItemChange(index, "challan_no", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="date"
                  value={item.challan_date}
                  onChange={(e) =>
                    handleItemChange(index, "challan_date", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) =>
                    handleItemChange(index, "qty", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) =>
                    handleItemChange(index, "rate", e.target.value)
                  }
                />
              </td>
              <td>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />
      <button onClick={addRow}>Add Row</button>

      <hr />

      <p>Subtotal: {subtotal.toFixed(2)}</p>
      <p>CGST: {cgst.toFixed(2)}</p>
      <p>SGST: {sgst.toFixed(2)}</p>
      <p>Total Before Round: {totalBeforeRound.toFixed(2)}</p>
      <p>Round Off: {roundOff.toFixed(2)}</p>
      <h3>Grand Total: {roundedTotal.toFixed(2)}</h3>

      <button onClick={handleSaveInvoice}>Save Invoice</button>
    </div>
  );
}
