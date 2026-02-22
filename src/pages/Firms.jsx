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

useEffect(() => {
  if (role) {
    fetchFirms()
  }
}, [role])

  const fetchFirms = async () => {
    const { data, error } = await supabase.from("firms").select("*");

    console.log("Fetch firms:", data, error);

    if (error) {
      alert(error.message);
      return;
    }

    setFirms(data || []);
  };

  const handleAddFirm = async (e) => {
    e.preventDefault();

    if (role !== "super_admin") {
      alert("Not allowed");
      return;
    }

    const { data, error } = await supabase.from("firms").insert([
      {
        firm_name: firmName,
        address: address,
        gst_number: gstNumber,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
      },
    ]);

    console.log("Insert result:", data, error);

    if (error) {
      alert(error.message);
      return;
    }

    setFirmName("");
    setGstNumber("");
    setAddress("");
    setBankName("");
    setAccountNumber("");
    setIfscCode("");
    fetchFirms();
  };

  return (
    <div>
      <div style={{ padding: 20 }}>
        <h2>Firms</h2>

        {role === "super_admin" && (
          <form onSubmit={handleAddFirm}>
            <input
              placeholder="Firm Name"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
            />
            <br />
            <br />
            <input
              placeholder="GST Number"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
            <br />
            <br />
            <input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <br />
            <br />

            <input
              placeholder="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <br />
            <br />

            <input
              placeholder="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
            <br />
            <br />

            <input
              placeholder="IFSC Code"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
            />
            <br />
            <br />
            <button type="submit">Add Firm</button>
          </form>
        )}

        <hr />

        <h3>Firm List</h3>

        {firms.map((firm) => (
          <div key={firm.id} style={{ marginBottom: 10 }}>
            <strong>{firm.firm_name}</strong>
            <br />
            GST: {firm.gst_number}
            <br />
            Bank: {firm.bank_name}
          </div>
        ))}
      </div>
    </div>
  );
}
