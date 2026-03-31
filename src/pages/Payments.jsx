import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Payments() {
  const [parties, setParties] = useState([]);
  const [payments, setPayments] = useState([]);

  const [selectedParty, setSelectedParty] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchParties();
    fetchPayments();
  }, []);

  const fetchParties = async () => {
    const { data } = await supabase.from("parties").select("*");
    setParties(data || []);
  };

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payments_in")
      .select(`
        *,
        parties (party_name)
      `)
      .order("payment_date", { ascending: false });

    setPayments(data || []);
  };

  const handleAddPayment = async () => {
    if (!selectedParty || !paymentDate || !amount) {
      alert("Please fill required fields");
      return;
    }

    const { error } = await supabase.from("payments_in").insert([
      {
        party_id: selectedParty,
        payment_date: paymentDate,
        amount: amount,
        payment_mode: paymentMode,
        reference_no: referenceNo,
        notes: notes,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Payment recorded");

    setSelectedParty("");
    setPaymentDate("");
    setAmount("");
    setReferenceNo("");
    setNotes("");

    fetchPayments();
  };

  return (
    <div className="page-card">
      <h2>Payments In</h2>

      <div className="grid-2">
        <div className="field">
          <label>Party</label>
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
          >
            <option value="">Select Party</option>
            {parties.map((party) => (
              <option key={party.id} value={party.id}>
                {party.party_name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Payment Date</label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Payment Mode</label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          >
            <option>NEFT</option>
            <option>RTGS</option>
            <option>IMPS</option>
            <option>Cheque</option>
          </select>
        </div>

        <div className="field">
          <label>Reference Number</label>
          <input
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <br />

      <button onClick={handleAddPayment}>Add Payment</button>

      <hr />

      <h3>Payment History</h3>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Party</th>
            <th>Mode</th>
            <th>Reference</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.payment_date}</td>
              <td>{p.parties?.party_name}</td>
              <td>{p.payment_mode}</td>
              <td>{p.reference_no}</td>
              <td>₹ {Number(p.amount).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}