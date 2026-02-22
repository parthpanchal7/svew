import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Parties({ role }) {

  const [parties, setParties] = useState([])
  const [partyName, setPartyName] = useState("")
  const [address, setAddress] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [state, setState] = useState("")

useEffect(() => {
  if (role) {
    fetchParties()
  }
}, [role])

  const fetchParties = async () => {
    const { data, error } = await supabase.from("parties").select("*")
    console.log("Fetch parties:", data, error)

    if (error) {
      alert(error.message)
      return
    }

    setParties(data || [])
  }

  const handleAddParty = async (e) => {
    e.preventDefault()

    if (role !== "super_admin") {
      alert("Not allowed")
      return
    }

    const { data, error } = await supabase.from("parties").insert([
      {
        party_name: partyName,
        address,
        gst_number: gstNumber,
        contact_person: contactPerson,
        contact_number: contactNumber,
        state
      }
    ])

    console.log("Insert party:", data, error)

    if (error) {
      alert(error.message)
      return
    }

    setPartyName("")
    setAddress("")
    setGstNumber("")
    setContactPerson("")
    setContactNumber("")
    setState("")

    fetchParties()
  }

  return (
    <div>
      <div style={{ padding: 20 }}>
        <h2>Parties</h2>

        {role === "super_admin" && (
          <form onSubmit={handleAddParty}>
            <input
              placeholder="Party Name"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
            />
            <br /><br />

            <input
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <br /><br />

            <input
              placeholder="GST Number"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
            <br /><br />

            <input
              placeholder="Contact Person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
            <br /><br />

            <input
              placeholder="Contact Number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
            <br /><br />

            <input
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
            <br /><br />

            <button type="submit">Add Party</button>
          </form>
        )}

        <hr />

        <h3>Party List</h3>

        {parties.map((party) => (
          <div key={party.id} style={{ marginBottom: 10 }}>
            <strong>{party.party_name}</strong>
            <br />
            GST: {party.gst_number}
            <br />
            State: {party.state}
          </div>
        ))}
      </div>
    </div>
  )
}