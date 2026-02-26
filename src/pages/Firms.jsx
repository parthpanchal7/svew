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

    const { error } = await supabase.from("firms").insert([{ firm_name: firmName, address, gst_number: gstNumber, bank_name: bankName, account_number: accountNumber, ifsc_code: ifscCode }]);
    if (error) return alert(error.message);

    setFirmName(""); setGstNumber(""); setAddress(""); setBankName(""); setAccountNumber(""); setIfscCode("");
    fetchFirms();
  };

  return (
    <section className="page-card">
      <h2 className="page-title">Firms</h2>
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
      <div className="summary-grid">{firms.map((firm) => <div key={firm.id} className="summary-item"><strong>{firm.firm_name}</strong><p className="muted">GST: {firm.gst_number}</p><p className="muted">Bank: {firm.bank_name}</p></div>)}</div>
    </section>
  );
}
