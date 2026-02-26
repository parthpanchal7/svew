import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-shell">
      <div className="page-card auth-card">
        <h2 className="page-title">Invoice System Login</h2>
        <p className="muted">Sign in to manage invoices, firms, and parties.</p>
        <form onSubmit={handleLogin} className="grid-2">
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button style={{ gridColumn: "1 / -1" }} type="submit">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
