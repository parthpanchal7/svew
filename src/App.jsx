import { useEffect, useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { supabase } from "./lib/supabase"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Invoices from "./pages/Invoices"
import Parties from "./pages/Parties"
import Firms from "./pages/Firms"
import CreateInvoice from "./pages/CreateInvoice"
import Navbar from "./components/Navbar"
import EditInvoice from "./pages/EditInvoice"
import ViewInvoice from "./pages/ViewInvoice"


function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        setRole(data?.role)
      }

      setLoading(false)
    }

    init()
  }, [])

  if (loading) return <div>Loading...</div>

  if (!session) return <Login />

  return (
    <>
      <Navbar role={role} />
      <Routes>
        <Route path="/dashboard" element={<Dashboard role={role} />} />
        <Route path="/invoices" element={<Invoices role={role} />} />
        <Route path="/parties" element={<Parties role={role} />} />
        <Route path="/firms" element={<Firms role={role} />} />
        <Route path="/create-invoice" element={<CreateInvoice role={role} />} />
        <Route path="/edit-invoice/:id" element={<EditInvoice />} />
        <Route path="/view-invoice/:id" element={<ViewInvoice />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  )
}

export default App