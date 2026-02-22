import { useEffect, useState } from "react"
import { getFinancialYear } from "../utils/invoiceNumber"
import { supabase } from "../lib/supabase"

export default function InvoiceForm({
  initialData = null,
  onSubmit
}) {

  const [firms, setFirms] = useState([])
  const [parties, setParties] = useState([])

  const [selectedFirm, setSelectedFirm] = useState("")
  const [selectedParty, setSelectedParty] = useState("")
  const [invoiceDate, setInvoiceDate] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [financialYear, setFinancialYear] = useState("")
  const [gstPercent, setGstPercent] = useState(18)

  const [items, setItems] = useState([
    { sr_no: 1, challan_no: "", challan_date: "", description: "", qty: 0, rate: 0, amount: 0 }
  ])

  useEffect(() => {
    fetchFirms()
    fetchParties()

    if (initialData) {
      setSelectedFirm(initialData.firm_id)
      setSelectedParty(initialData.party_id)
      setInvoiceDate(initialData.invoice_date)
      setInvoiceNumber(initialData.invoice_number)
      setFinancialYear(initialData.financial_year)
      setItems(initialData.items || [])
    }
  }, [])

  const fetchFirms = async () => {
    const { data } = await supabase.from("firms").select("*")
    setFirms(data || [])
  }

  const fetchParties = async () => {
    const { data } = await supabase.from("parties").select("*")
    setParties(data || [])
  }

  const handleItemChange = (index, field, value) => {
    const updated = [...items]
    updated[index][field] = value

    if (field === "qty" || field === "rate") {
      updated[index].amount =
        Number(updated[index].qty) * Number(updated[index].rate)
    }

    setItems(updated)
  }

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
        amount: 0
      }
    ])
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0)
  const gstAmount = (subtotal * gstPercent) / 100
  const cgst = gstAmount / 2
  const sgst = gstAmount / 2
  const totalBeforeRound = subtotal + gstAmount
  const roundedTotal = Math.round(totalBeforeRound)
  const roundOff = roundedTotal - totalBeforeRound

  const handleSubmit = () => {
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
      items
    })
  }

  return (
    <div>

      <input
        type="date"
        value={invoiceDate}
        onChange={(e) => setInvoiceDate(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Invoice Number"
        value={invoiceNumber}
        onChange={(e) => setInvoiceNumber(e.target.value)}
      />

      <br /><br />

      <select
        value={selectedFirm}
        onChange={(e) => setSelectedFirm(e.target.value)}
      >
        <option value="">Select Firm</option>
        {firms.map(f => (
          <option key={f.id} value={f.id}>{f.firm_name}</option>
        ))}
      </select>

      <br /><br />

      <select
        value={selectedParty}
        onChange={(e) => setSelectedParty(e.target.value)}
      >
        <option value="">Select Party</option>
        {parties.map(p => (
          <option key={p.id} value={p.id}>{p.party_name}</option>
        ))}
      </select>

      <hr />

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Sr</th>
            <th>Challan</th>
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

      <button onClick={handleSubmit}>
        Save
      </button>

    </div>
  )
}