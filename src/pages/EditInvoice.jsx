/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InvoiceForm from "../components/InvoiceForm";
import { supabase } from "../lib/supabase";

export default function EditInvoice() {
  const { id } = useParams();
  const [invoiceData, setInvoiceData] = useState(null);

  async function fetchInvoice() {
    const { data } = await supabase.from("invoices").select("*").eq("id", id).single();
    const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", id);
    setInvoiceData({ ...data, items });
  }

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleUpdate = async (formData) => {
    await supabase.from("invoices").update(formData).eq("id", id);
    await supabase.from("invoice_items").delete().eq("invoice_id", id);
    await supabase.from("invoice_items").insert(formData.items.map((item) => ({ ...item, invoice_id: id })));
    alert("Invoice updated");
  };

  if (!invoiceData) return <div className="page-card">Loading...</div>;
  return <InvoiceForm initialData={invoiceData} onSubmit={handleUpdate} />;
}
