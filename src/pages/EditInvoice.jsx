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
    const { items, ...invoiceUpdateData } = formData;
    
    try {
      const { error: invError } = await supabase.from("invoices").update(invoiceUpdateData).eq("id", id);
      if (invError) throw invError;
      
      const { error: delError } = await supabase.from("invoice_items").delete().eq("invoice_id", id);
      if (delError) throw delError;
      
      // Strip existing IDs to prevent primary key conflicts on re-insertion
      const newItems = items.map((item) => {
        const { id: _id, created_at: _created, ...cleanItem } = item;
        return { ...cleanItem, invoice_id: id };
      });
      
      const { error: insError } = await supabase.from("invoice_items").insert(newItems);
      if (insError) throw insError;
      
      alert("Invoice updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Error updating invoice: " + error.message);
    }
  };

  if (!invoiceData) return <div className="page-card">Loading...</div>;
  return <InvoiceForm initialData={invoiceData} onSubmit={handleUpdate} />;
}
