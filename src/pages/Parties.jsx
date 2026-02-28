/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Parties({ role }) {
  const [parties, setParties] = useState([]);
  const [partyName, setPartyName] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [state, setState] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    party_name: "",
    address: "",
    gst_number: "",
    contact_person: "",
    contact_number: "",
    state: "",
  });

  async function fetchParties() {
    const { data, error } = await supabase.from("parties").select("*");
    if (error) return alert(error.message);
    setParties(data || []);
  }

  useEffect(() => {
    if (role) fetchParties();
  }, [role]);

  const handleAddParty = async (event) => {
    event.preventDefault();
    if (role !== "super_admin") return alert("Not allowed");

    const { error } = await supabase.from("parties").insert([{
      party_name: partyName,
      address,
      gst_number: gstNumber,
      contact_person: contactPerson,
      contact_number: contactNumber,
      state,
    }]);
    if (error) return alert(error.message);

    setPartyName("");
    setAddress("");
    setGstNumber("");
    setContactPerson("");
    setContactNumber("");
    setState("");
    fetchParties();
  };

  const startEdit = (party) => {
    setEditingId(party.id);
    setEditForm({
      party_name: party.party_name || "",
      address: party.address || "",
      gst_number: party.gst_number || "",
      contact_person: party.contact_person || "",
      contact_number: party.contact_number || "",
      state: party.state || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      party_name: "",
      address: "",
      gst_number: "",
      contact_person: "",
      contact_number: "",
      state: "",
    });
  };

  const handleSaveEdit = async (id) => {
    if (role !== "super_admin") return alert("Not allowed");

    const { error } = await supabase
      .from("parties")
      .update(editForm)
      .eq("id", id);

    if (error) return alert(error.message);

    cancelEdit();
    fetchParties();
  };

  return (
    <section className="page-card">
      <h2 className="page-title">Parties</h2>
      <p className="muted">Manage customer details used in invoices.</p>

      {role === "super_admin" && (
        <form onSubmit={handleAddParty} className="grid-2">
          <div className="field"><label>Party Name</label><input value={partyName} onChange={(e) => setPartyName(e.target.value)} /></div>
          <div className="field"><label>GST Number</label><input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="field"><label>Contact Person</label><input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></div>
          <div className="field"><label>Contact Number</label><input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} /></div>
          <div className="field"><label>State</label><input value={state} onChange={(e) => setState(e.target.value)} /></div>
          <div><button type="submit">Add Party</button></div>
        </form>
      )}

      <h3>Party List</h3>
      <div className="record-list">
        {parties.map((party) => (
          <article key={party.id} className="record-card">
            <div className="record-head">
              <div>
                <strong>{party.party_name}</strong>
                <p className="muted">{party.address || "No address added"}</p>
              </div>
              {role === "super_admin" && editingId !== party.id && (
                <div className="record-actions">
                  <button type="button" className="secondary" onClick={() => startEdit(party)}>Edit</button>
                </div>
              )}
            </div>

            <div className="record-meta">
              <span>GST: {party.gst_number || "-"}</span>
              <span>Contact: {party.contact_person || "-"}</span>
              <span>Phone: {party.contact_number || "-"}</span>
              <span>State: {party.state || "-"}</span>
            </div>

            {editingId === party.id && (
              <div className="record-edit grid-2">
                <div className="field">
                  <label>Party Name</label>
                  <input value={editForm.party_name} onChange={(e) => setEditForm((prev) => ({ ...prev, party_name: e.target.value }))} />
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
                  <label>Contact Person</label>
                  <input value={editForm.contact_person} onChange={(e) => setEditForm((prev) => ({ ...prev, contact_person: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Contact Number</label>
                  <input value={editForm.contact_number} onChange={(e) => setEditForm((prev) => ({ ...prev, contact_number: e.target.value }))} />
                </div>
                <div className="field">
                  <label>State</label>
                  <input value={editForm.state} onChange={(e) => setEditForm((prev) => ({ ...prev, state: e.target.value }))} />
                </div>
                <div className="record-actions">
                  <button type="button" onClick={() => handleSaveEdit(party.id)}>Save Changes</button>
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
