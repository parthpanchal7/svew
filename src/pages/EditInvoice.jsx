import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import InvoiceForm from "../components/InvoiceForm"

export default function EditInvoice() {

  const { id } = useParams()
  const [invoiceData, setInvoiceData] = useState(null)

  useEffect(() => {
    fetchInvoice()
  }, [])

  const fetchInvoice = async () => {

    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single()

    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)

    setInvoiceData({
      ...data,
      items
    })
  }

  const handleUpdate = async (formData) => {

    await supabase
      .from("invoices")
      .update(formData)
      .eq("id", id)

    await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", id)

    await supabase
      .from("invoice_items")
      .insert(
        formData.items.map(item => ({
          ...item,
          invoice_id: id
        }))
      )

    alert("Invoice updated")
  }

  if (!invoiceData) return <div>Loading...</div>

  return <InvoiceForm initialData={invoiceData} onSubmit={handleUpdate} />
}