import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function Navbar({ role }) {

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ padding: 20, borderBottom: "1px solid #ccc" }}>
      
      <Link to="/dashboard">Dashboard</Link>

      {" | "}
      <Link to="/invoices">Invoices</Link>

      {" | "}
      
      <Link to="/create-invoice">Create Invoice</Link>

      {role === "super_admin" && (
        <>
          {" | "}
          <Link to="/parties">Parties</Link>
          {" | "}
          <Link to="/firms">Firms</Link>
        </>
      )}

      {" | "}
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}