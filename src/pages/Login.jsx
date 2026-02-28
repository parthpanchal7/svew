import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import BrandLogo from "../components/BrandLogo";

export default function Login() {
  const navigate = useNavigate();
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
    } else {
      navigate("/dashboard", { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="auth-shell">
      <div className="page-card auth-card">
        <div className="brand-cluster auth-brand">
          <BrandLogo size={44} />
          <div>
            <strong>SVEW Billing</strong>
            <p className="muted">Mobile Invoice Suite</p>
          </div>
        </div>
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
