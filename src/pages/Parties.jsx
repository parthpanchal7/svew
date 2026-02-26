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

    const { error } = await supabase.from("parties").insert([{ party_name: partyName, address, gst_number: gstNumber, contact_person: contactPerson, contact_number: contactNumber, state }]);
    if (error) return alert(error.message);

    setPartyName(""); setAddress(""); setGstNumber(""); setContactPerson(""); setContactNumber(""); setState("");
    fetchParties();
  };

  return (
    <section className="page-card">
      <h2 className="page-title">Parties</h2>
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
      <div className="summary-grid">{parties.map((party) => <div key={party.id} className="summary-item"><strong>{party.party_name}</strong><p className="muted">GST: {party.gst_number}</p><p className="muted">State: {party.state}</p></div>)}</div>
    </section>
  );
}
