/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Firms({ role }) {
  const [firms, setFirms] = useState([]);
  const [firmName, setFirmName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    firm_name: "",
    gst_number: "",
    address: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
  });

  async function fetchFirms() {
    const { data, error } = await supabase.from("firms").select("*");
    if (error) return alert(error.message);
    setFirms(data || []);
  }

  useEffect(() => {
    if (role) fetchFirms();
  }, [role]);

  const handleAddFirm = async (event) => {
    event.preventDefault();
    if (role !== "super_admin") return alert("Not allowed");

    const { error } = await supabase.from("firms").insert([{
      firm_name: firmName,
      address,
      gst_number: gstNumber,
      bank_name: bankName,
      account_number: accountNumber,
      ifsc_code: ifscCode,
    }]);
    if (error) return alert(error.message);

    setFirmName("");
    setGstNumber("");
    setAddress("");
    setBankName("");
    setAccountNumber("");
    setIfscCode("");
    fetchFirms();
  };

  const startEdit = (firm) => {
    setEditingId(firm.id);
    setEditForm({
      firm_name: firm.firm_name || "",
      gst_number: firm.gst_number || "",
      address: firm.address || "",
      bank_name: firm.bank_name || "",
      account_number: firm.account_number || "",
      ifsc_code: firm.ifsc_code || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      firm_name: "",
      gst_number: "",
      address: "",
      bank_name: "",
      account_number: "",
      ifsc_code: "",
    });
  };

  const handleSaveEdit = async (id) => {
    if (role !== "super_admin") return alert("Not allowed");

    const { error } = await supabase
      .from("firms")
      .update(editForm)
      .eq("id", id);

    if (error) return alert(error.message);

    cancelEdit();
    fetchFirms();
  };

  return (
    <section className="page-card">
      <h2 className="page-title">Firms</h2>
      <p className="muted">Manage company and bank details used on invoices.</p>

      {role === "super_admin" && (
        <form onSubmit={handleAddFirm} className="grid-2">
          <div className="field"><label>Firm Name</label><input value={firmName} onChange={(e) => setFirmName(e.target.value)} /></div>
          <div className="field"><label>GST Number</label><input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="field"><label>Bank Name</label><input value={bankName} onChange={(e) => setBankName(e.target.value)} /></div>
          <div className="field"><label>Account Number</label><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></div>
          <div className="field"><label>IFSC Code</label><input value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} /></div>
          <div><button type="submit">Add Firm</button></div>
        </form>
      )}

      <h3>Firm List</h3>
      <div className="record-list">
        {firms.map((firm) => (
          <article key={firm.id} className="record-card">
            <div className="record-head">
              <div>
                <strong>{firm.firm_name}</strong>
                <p className="muted">{firm.address || "No address added"}</p>
              </div>
              {role === "super_admin" && editingId !== firm.id && (
                <div className="record-actions">
                  <button type="button" className="secondary" onClick={() => startEdit(firm)}>Edit</button>
                </div>
              )}
            </div>

            <div className="record-meta">
              <span>GST: {firm.gst_number || "-"}</span>
              <span>Bank: {firm.bank_name || "-"}</span>
              <span>A/C: {firm.account_number || "-"}</span>
              <span>IFSC: {firm.ifsc_code || "-"}</span>
            </div>

            {editingId === firm.id && (
              <div className="record-edit grid-2">
                <div className="field">
                  <label>Firm Name</label>
                  <input value={editForm.firm_name} onChange={(e) => setEditForm((prev) => ({ ...prev, firm_name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>GST Number</label>
                  <input value={editForm.gst_number} onChange={(e) => setEditForm((prev) => ({ ...prev, gst_number: e.target.value }))} />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Address</label>
                  <input value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Bank Name</label>
                  <input value={editForm.bank_name} onChange={(e) => setEditForm((prev) => ({ ...prev, bank_name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Account Number</label>
                  <input value={editForm.account_number} onChange={(e) => setEditForm((prev) => ({ ...prev, account_number: e.target.value }))} />
                </div>
                <div className="field">
                  <label>IFSC Code</label>
                  <input value={editForm.ifsc_code} onChange={(e) => setEditForm((prev) => ({ ...prev, ifsc_code: e.target.value }))} />
                </div>
                <div className="record-actions">
                  <button type="button" onClick={() => handleSaveEdit(firm.id)}>Save Changes</button>
                  <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
