import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function ViewInvoice() {

  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    fetchInvoice()
  }, [])

  const fetchInvoice = async () => {

    const { data } = await supabase
      .from("invoices")
      .select(`
        *,
        firms (*),
        parties (*)
      `)
      .eq("id", id)
      .single()

    const { data: itemData } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)

    setInvoice(data)
    setItems(itemData || [])
  }

  if (!invoice) return <div>Loading...</div>

  return (
    <div style={{ padding: 40 }}>

      <h2>Tax Invoice</h2>

      <hr />

      <h3>{invoice.firms.firm_name}</h3>
      <p>{invoice.firms.address}</p>
      <p>GSTIN: {invoice.firms.gst_number}</p>

      <hr />

      <p><strong>Invoice No:</strong> {invoice.invoice_number}</p>
      <p><strong>Date:</strong> {invoice.invoice_date}</p>

      <hr />

      <h4>Bill To:</h4>
      <p>{invoice.parties.party_name}</p>
      <p>{invoice.parties.address}</p>
      <p>GST: {invoice.parties.gst_number}</p>

      <hr />

      <table border="1" width="100%" cellPadding="5">
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
              <td>{item.challan_no}</td>
              <td>{item.challan_date}</td>
              <td>{item.description}</td>
              <td>{item.qty}</td>
              <td>{item.rate}</td>
              <td>{item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <p>Subtotal: {invoice.subtotal}</p>
      <p>CGST: {invoice.cgst}</p>
      <p>SGST: {invoice.sgst}</p>
      <p>Round Off: {invoice.round_off}</p>

      <h3>Total: {invoice.grand_total}</h3>

      <hr />

      <h4>Bank Details:</h4>
      <p>Bank: {invoice.firms.bank_name}</p>
      <p>A/C No: {invoice.firms.account_number}</p>
      <p>IFSC: {invoice.firms.ifsc_code}</p>

      <br /><br />

      <button onClick={() => window.print()}>
        Print
      </button>

    </div>
  )
}