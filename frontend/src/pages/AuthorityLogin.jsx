import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Outfit:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --navy: #0a0f1e;
  --navy-mid: #111827;
  --navy-card: #141c2e;
  --navy-border: rgba(255,255,255,0.07);
  --gold: #c9a84c;
  --gold-light: #e8c97a;
  --gold-pale: rgba(201,168,76,0.12);
  --gold-glow: rgba(201,168,76,0.25);
  --white: #f0ece4;
  --muted: #8891a4;
  --error: #f87171;
  --success: #34d399;
  --indigo: #6366f1;
}

body { background: var(--navy); }

.al-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-family: 'Outfit', sans-serif;
  background: var(--navy);
  overflow: hidden;
}

/* ─── LEFT PANEL ─── */
.al-left {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px;
  background: linear-gradient(135deg, #060b18 0%, #0d1528 50%, #111d38 100%);
  overflow: hidden;
}

.al-left::before {
  content: '';
  position: absolute;
  top: -120px; left: -120px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 65%);
  pointer-events: none;
}

.al-left::after {
  content: '';
  position: absolute;
  bottom: -80px; right: -80px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%);
  pointer-events: none;
}

.al-grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 60px 60px;
}

.al-emblem {
  position: relative;
  z-index: 1;
  width: 72px; height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
  box-shadow: 0 8px 32px rgba(201,168,76,0.35), 0 2px 8px rgba(0,0,0,0.5);
  margin-bottom: 32px;
}

.al-tagline-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--gold-pale);
  border: 1px solid rgba(201,168,76,0.3);
  border-radius: 100px;
  padding: 5px 14px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold-light);
  margin-bottom: 20px;
  width: fit-content;
  position: relative; z-index: 1;
}

.al-tagline-badge::before {
  content: '';
  width: 6px; height: 6px;
  background: var(--gold);
  border-radius: 50%;
}

.al-headline {
  font-family: 'Playfair Display', serif;
  font-size: 48px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--white);
  margin-bottom: 20px;
  position: relative; z-index: 1;
}

.al-headline em {
  font-style: normal;
  background: linear-gradient(90deg, var(--gold), var(--gold-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.al-subtext {
  font-size: 15px;
  color: var(--muted);
  line-height: 1.7;
  max-width: 360px;
  position: relative; z-index: 1;
  margin-bottom: 52px;
}

.al-stats {
  display: flex;
  gap: 36px;
  position: relative; z-index: 1;
}

.al-stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.al-stat-num {
  font-size: 26px;
  font-weight: 600;
  color: var(--white);
  font-variant-numeric: tabular-nums;
}

.al-stat-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.al-divider-v {
  width: 1px;
  background: var(--navy-border);
  align-self: stretch;
}

/* ─── RIGHT PANEL ─── */
.al-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 48px 56px;
  background: var(--navy-card);
  position: relative;
   overflow-y: auto;
}

/* AFTER */
.al-right::before {
  content: '';
  position: absolute;
  top: -200px; right: -200px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;   /* ✅ explicitly push it below */
}

.al-form-container {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 99;  /* ✅ push form container above everything */
}

.al-form-title {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 600;
  color: var(--white);
  margin-bottom: 6px;
}

.al-form-sub {
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 32px;
}

/* Tabs */
.al-tabs {
  display: flex;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--navy-border);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 32px;
}

.al-tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 9px;
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.25s;
}

.al-tab.active {
  background: linear-gradient(135deg, #1e2a47, #1a2340);
  color: var(--white);
  box-shadow: 0 1px 6px rgba(0,0,0,0.3);
}

/* Fields */
.al-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 18px;
}

.al-label {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.al-input-wrap {
  position: relative;
}

.al-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 15px;
  opacity: 0.45;
  pointer-events: none;
}

.al-input {
  width: 100%;
  padding: 12px 14px 12px 40px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 10px;
  color: var(--white);
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.al-input::placeholder { color: #4b5568; }

.al-input:focus {
  border-color: rgba(201,168,76,0.5);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.08);
  background: rgba(255,255,255,0.06);
}

.al-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* Error / Success */
.al-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.al-alert.error {
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.2);
  color: var(--error);
}

.al-alert.success {
  background: rgba(52,211,153,0.08);
  border: 1px solid rgba(52,211,153,0.2);
  color: var(--success);
}

/* Button */
.al-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  margin-top: 6px;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.02em;
}

.al-btn-primary {
  background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%);
  color: #0a0f1e;
  box-shadow: 0 4px 20px rgba(201,168,76,0.3);
}

.al-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 28px rgba(201,168,76,0.4);
}

.al-btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.al-btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(255,255,255,0.12), transparent);
  border-radius: inherit;
  pointer-events: none;
}

/* Divider */
.al-or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 22px 0;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.al-or::before, .al-or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--navy-border);
}

/* Bottom link */
.al-switch {
  text-align: center;
  font-size: 13px;
  color: var(--muted);
  
}

.al-switch a {
  color: var(--gold-light);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  pointer-events: all;  
}

.al-switch a:hover { text-decoration: underline; }

.al-citizen-btn {
  background: none;
  border: none;
  color: var(--gold-light);
  font-weight: 500;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  position: relative;
  z-index: 99;
  pointer-events: all;
  transition: color 0.2s;
}

.al-citizen-btn:hover {
  color: var(--gold);
  text-decoration: underline;
}

/* Password eye */
.al-eye {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted);
  font-size: 16px;
  padding: 2px;
  line-height: 1;
  transition: color 0.2s;
}

.al-eye:hover { color: var(--white); }

.al-input.with-eye { padding-right: 42px; }

/* Spinner */
.al-spin {
  display: inline-block;
  width: 16px; height: 16px;
  border: 2px solid rgba(10,15,30,0.3);
  border-top-color: #0a0f1e;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  vertical-align: middle;
  margin-right: 8px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Responsive */
@media (max-width: 768px) {
  .al-root { grid-template-columns: 1fr; }
  .al-left { display: none; }
  .al-right { padding: 36px 24px; }
}
`;

export default function AuthorityLogin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "", email: "", password: "", confirm: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });
      if (authErr) throw authErr;

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileErr || !profile) throw new Error("Profile not found.");
      if (!['admin', 'officer'].includes(profile.role)) {
  await supabase.auth.signOut();
  throw new Error("Restricted to authority accounts only.");
}

navigate("/authority/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!signupForm.fullName.trim()) return setError("Full name is required.");
    if (signupForm.password.length < 6) return setError("Password must be at least 6 characters.");
    if (signupForm.password !== signupForm.confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
      });
      if (authErr) throw authErr;

      const userId = data.user?.id;
      if (userId) {
        const { error: profileErr } = await supabase.from("profiles").upsert({
  id: userId,
  full_name: signupForm.fullName.trim(),
  role: "admin",
}, { onConflict: "id" });  // if same id exists, update it instead of failing
if (profileErr) throw profileErr;

// Also store role in auth user metadata so RLS policies can read it without recursion
await supabase.auth.updateUser({
  data: { role: "admin" }
});
      }

      setSuccess("Account created! You can now sign in.");
      setTab("login");
      setLoginForm({ email: signupForm.email, password: "" });
      setSignupForm({ fullName: "", email: "", password: "", confirm: "" });
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="al-root">
        {/* LEFT */}
        <div className="al-left">
          <div className="al-grid-lines" />
          <div className="al-emblem">🏛️</div>
          <div className="al-tagline-badge">Authority Portal</div>
          <h1 className="al-headline">
            Civic <em>Intelligence</em><br />Command
          </h1>
          <p className="al-subtext">
            A centralized dashboard for administrators to monitor, manage, and resolve civic issues across all wards — in real time.
          </p>
          <div className="al-stats">
            <div className="al-stat-item">
              <span className="al-stat-num">6</span>
              <span className="al-stat-label">Active Issues</span>
            </div>
            <div className="al-divider-v" />
            <div className="al-stat-item">
              <span className="al-stat-num">12</span>
              <span className="al-stat-label">Wards Covered</span>
            </div>
            <div className="al-divider-v" />
            <div className="al-stat-item">
              <span className="al-stat-num">98%</span>
              <span className="al-stat-label">Uptime</span>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="al-right">
          <div className="al-form-container">
            <h2 className="al-form-title">
              {tab === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="al-form-sub">
              {tab === "login"
                ? "Sign in to your administrator account"
                : "Register a new administrator account"}
            </p>

            <div className="al-tabs">
              <button
                className={`al-tab${tab === "login" ? " active" : ""}`}
                onClick={() => { setTab("login"); setError(""); setSuccess(""); }}
              >Sign In</button>
              <button
                className={`al-tab${tab === "signup" ? " active" : ""}`}
                onClick={() => { setTab("signup"); setError(""); setSuccess(""); }}
              >Create Account</button>
            </div>

            {error && (
              <div className="al-alert error">
                <span>⚠</span> {error}
              </div>
            )}
            {success && (
              <div className="al-alert success">
                <span>✓</span> {success}
              </div>
            )}

            {tab === "login" ? (
              <form onSubmit={handleLogin}>
                <div className="al-field">
                  <label className="al-label">Email Address</label>
                  <div className="al-input-wrap">
                    <span className="al-input-icon">✉</span>
                    <input
                      className="al-input"
                      type="email"
                      placeholder="admin@domain.gov"
                      value={loginForm.email}
                      onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="al-field">
                  <label className="al-label">Password</label>
                  <div className="al-input-wrap">
                    <span className="al-input-icon">🔒</span>
                    <input
                      className={`al-input with-eye`}
                      type={showPwd ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                      required
                      autoComplete="current-password"
                    />
                    <button type="button" className="al-eye" onClick={() => setShowPwd(v => !v)}>
                      {showPwd ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>
                <button className="al-btn al-btn-primary" disabled={loading}>
                  {loading ? <><span className="al-spin" />Signing In…</> : "Sign In →"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <div className="al-field">
                  <label className="al-label">Full Name</label>
                  <div className="al-input-wrap">
                    <span className="al-input-icon">👤</span>
                    <input
                      className="al-input"
                      type="text"
                      placeholder="Your full name"
                      value={signupForm.fullName}
                      onChange={e => setSignupForm(p => ({ ...p, fullName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="al-field">
                  <label className="al-label">Email Address</label>
                  <div className="al-input-wrap">
                    <span className="al-input-icon">✉</span>
                    <input
                      className="al-input"
                      type="email"
                      placeholder="admin@domain.gov"
                      value={signupForm.email}
                      onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="al-row">
                  <div className="al-field">
                    <label className="al-label">Password</label>
                    <div className="al-input-wrap">
                      <span className="al-input-icon">🔒</span>
                      <input
                        className={`al-input with-eye`}
                        type={showPwd ? "text" : "password"}
                        placeholder="Min 6 chars"
                        value={signupForm.password}
                        onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))}
                        required
                      />
                      <button type="button" className="al-eye" onClick={() => setShowPwd(v => !v)}>
                        {showPwd ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                  <div className="al-field">
                    <label className="al-label">Confirm</label>
                    <div className="al-input-wrap">
                      <span className="al-input-icon">🔒</span>
                      <input
                        className={`al-input with-eye`}
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat password"
                        value={signupForm.confirm}
                        onChange={e => setSignupForm(p => ({ ...p, confirm: e.target.value }))}
                        required
                      />
                      <button type="button" className="al-eye" onClick={() => setShowConfirm(v => !v)}>
                        {showConfirm ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                </div>
                <button className="al-btn al-btn-primary" disabled={loading}>
                  {loading ? <><span className="al-spin" />Creating Account…</> : "Create Account →"}
                </button>
              </form>
            )}

            <div className="al-or">or</div>
            <div className="al-switch">
              Not an authority?{" "}
              <a href="/login" onClick={e => { e.preventDefault(); navigate("/citizen-login"); }}>
                Citizen Portal →
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
