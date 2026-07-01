import { useState } from "react";
import { login } from "../lib/auth";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    try {
      const result = await login(email, password);
      onLogin(result);
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  return (
    <div className="login-page">
      <section className="login-card">
        <span className="eyebrow">Helios CM Enterprise</span>
        <h1>Construction Governance Platform</h1>
        <p>Login con ruoli separati IPP / EPC.</p>

        <input
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && <div className="alert error">{error}</div>}

        <button className="primary-button" type="button" onClick={handleLogin}>
          Accedi
        </button>

        <div className="demo-buttons">
          <button
            type="button"
            onClick={() =>
              onLogin({
                user: { id: "demo-ipp", email: "demo.ipp@helios.local" },
                profile: {
                  id: "demo-ipp",
                  email: "demo.ipp@helios.local",
                  fullName: "Demo IPP Admin",
                  role: "admin",
                  company: "IPP"
                }
              })
            }
          >
            Demo IPP
          </button>
          <button
            type="button"
            onClick={() =>
              onLogin({
                user: { id: "demo-epc", email: "demo.epc@helios.local" },
                profile: {
                  id: "demo-epc",
                  email: "demo.epc@helios.local",
                  fullName: "Demo EPC",
                  role: "epc_pm",
                  company: "EPC"
                }
              })
            }
          >
            Demo EPC
          </button>
        </div>
      </section>
    </div>
  );
}
