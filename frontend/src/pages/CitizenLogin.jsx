import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@500&display=swap');

  .citizen-root {
    min-height: 100vh;
    display: flex;
    font-family: 'DM Sans', sans-serif;
    background: #f8f9fc;
  }

  .citizen-left {
    width: 42%;
    background: #0a0f2e;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 44px;
    position: relative;
    overflow: hidden;
  }

  .citizen-left::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 320px; height: 320px;
    border-radius: 50%;
    background: #111a45;
    opacity: 0.5;
  }

  .citizen-left::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -60px;
    width: 240px; height: 240px;
    border-radius: 50%;
    background: #111a45;
    opacity: 0.4;
  }

  .cl-brand {
    position: relative; z-index: 1;
  }

  .cl-brand-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: #f59e0b;
    display: inline-block;
    margin-right: 8px;
  }

  .cl-brand-name {
    font-size: 15px;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.05em;
  }

  .cl-hero {
    position: relative; z-index: 1;
  }

  .cl-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: 38px;
    font-weight: 500;
    color: white;
    line-height: 1.2;
    margin-bottom: 16px;
  }

  .cl-hero-sub {
    font-size: 14px;
    color: rgba(255,255,255,0.5);
    line-height: 1.7;
    max-width: 260px;
  }

  .cl-stats {
    display: flex;
    gap: 24px;
    position: relative; z-index: 1;
  }

  .cl-stat {
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 12px;
  }

  .cl-stat-n {
    font-size: 22px;
    font-weight: 500;
    color: #f59e0b;
  }

  .cl-stat-l {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    margin-top: 2px;
  }

  .citizen-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
  }

  .cl-form-wrap {
    width: 100%;
    max-width: 360px;
  }

  .cl-form-eyebrow {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    color: #f59e0b;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .cl-form-title {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 500;
    color: #0a0f2e;
    margin-bottom: 6px;
  }

  .cl-form-sub {
    font-size: 13px;
    color: #94a3b8;
    margin-bottom: 32px;
  }

  .cl-field {
    margin-bottom: 18px;
  }

  .cl-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #475569;
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }

  .cl-input {
    width: 100%;
    padding: 11px 14px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    color: #0a0f2e;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  .cl-input:focus {
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.15);
  }

  .cl-input.error {
    border-color: #d35f5f;
  }

  .cl-error {
    font-size: 11px;
    color: #d35f5f;
    margin-top: 4px;
  }

  .cl-forgot {
    text-align: right;
    margin-top: -10px;
    margin-bottom: 20px;
  }

  .cl-forgot a {
    font-size: 12px;
    color: #94a3b8;
    text-decoration: none;
    cursor: pointer;
  }

  .cl-forgot a:hover { text-decoration: underline; }

  .cl-submit {
    width: 100%;
    padding: 12px;
    background: #0a0f2e;
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
    letter-spacing: 0.02em;
  }

  .cl-submit:hover { background: #111a45; }
  .cl-submit:active { transform: scale(0.99); }
  .cl-submit:disabled { background: #94a3b8; cursor: not-allowed; }

  .cl-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
    font-size: 12px;
    color: #cbd5e1;
  }

  .cl-divider::before, .cl-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  .cl-switch {
    text-align: center;
    font-size: 13px;
    color: #94a3b8;
  }

  .cl-switch a {
    color: #0a0f2e;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
  }

  .cl-switch a:hover { text-decoration: underline; }

  .cl-toast {
    position: fixed;
    bottom: 24px; right: 24px;
    background: #0a0f2e;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 13px;
    animation: slideUp 0.3s ease;
    z-index: 1000;
  }

  .cl-toast.error { background: #8b2e2e; }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }

  .cl-loading {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: middle;
    margin-right: 6px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) {
    .citizen-left { display: none; }
    .citizen-right { padding: 32px 24px; }
  }
`;

export default function CitizenLogin({ onSwitchToAuth }) {
  const navigate = useNavigate();
  const [mode, setMode]       = useState("login"); // "login" | "signup"
  const [form, setForm]       = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validate = () => {
    const e = {};
    if (mode === "signup" && !form.name.trim()) e.name = "Name is required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (form.password.length < 6) e.password = "Min 6 characters";
    if (mode === "signup" && form.password !== form.confirm) e.confirm = "Passwords don't match";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      if (mode === "login") {
        // ── SUPABASE LOGIN ──
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
       if (error) throw new Error(error.message);

const { data: profile, error: profileErr } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", data.user.id)
  .single();

if (profileErr || !profile) throw new Error("Profile not found.");

if (profile.role === 'admin' || profile.role === 'officer') {
  await supabase.auth.signOut();
  throw new Error("Please use the Authority portal to sign in.");
}

showToast("Welcome back!");
setTimeout(() => navigate('/my-issues'), 800);

      } else {
        // ── SUPABASE SIGNUP ──
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
              phone: form.phone,
              role: 'citizen',
            }
          }
        });
        if (error) throw new Error(error.message);

        showToast("Account created! Check your email to verify.");
        setTimeout(() => navigate('/my-issues'), 800);
      }

    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <style>{styles}</style>
      <div className="citizen-root">
        {/* Left panel */}
        <div className="citizen-left">
          <div className="cl-brand">
            <span className="cl-brand-dot" />
            <span className="cl-brand-name">CivicReport</span>
          </div>
          <div className="cl-hero">
            <div className="cl-hero-title">Your voice shapes your city.</div>
            <div className="cl-hero-sub">
              Report issues, track progress, and see your neighbourhood improve — together.
            </div>
          </div>
          <div className="cl-stats">
            <div className="cl-stat">
              <div className="cl-stat-n">2,400+</div>
              <div className="cl-stat-l">Issues resolved</div>
            </div>
            <div className="cl-stat">
              <div className="cl-stat-n">3.2 days</div>
              <div className="cl-stat-l">Avg resolution</div>
            </div>
            <div className="cl-stat">
              <div className="cl-stat-n">18 wards</div>
              <div className="cl-stat-l">Covered</div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="citizen-right">
          <div className="cl-form-wrap">
            <div className="cl-form-eyebrow">Citizen portal</div>
            <div className="cl-form-title">
              {mode === "login" ? "Welcome back" : "Create account"}
            </div>
            <div className="cl-form-sub">
              {mode === "login"
                ? "Sign in to report and track issues in your area."
                : "Join thousands of citizens making a difference."}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {mode === "signup" && (
                <div className="cl-field">
                  <label className="cl-label">Full name</label>
                  <input className={`cl-input${errors.name ? " error" : ""}`}
                    type="text" placeholder="Priya Sharma"
                    value={form.name} onChange={set("name")} />
                  {errors.name && <div className="cl-error">{errors.name}</div>}
                </div>
              )}

              <div className="cl-field">
                <label className="cl-label">Email address</label>
                <input className={`cl-input${errors.email ? " error" : ""}`}
                  type="email" placeholder="you@example.com"
                  value={form.email} onChange={set("email")} />
                {errors.email && <div className="cl-error">{errors.email}</div>}
              </div>

              {mode === "signup" && (
                <div className="cl-field">
                  <label className="cl-label">Phone number (optional)</label>
                  <input className="cl-input" type="tel" placeholder="+91 98765 43210"
                    value={form.phone} onChange={set("phone")} />
                </div>
              )}

              <div className="cl-field">
                <label className="cl-label">Password</label>
                <input className={`cl-input${errors.password ? " error" : ""}`}
                  type="password" placeholder="••••••••"
                  value={form.password} onChange={set("password")} />
                {errors.password && <div className="cl-error">{errors.password}</div>}
              </div>

              {mode === "signup" && (
                <div className="cl-field">
                  <label className="cl-label">Confirm password</label>
                  <input className={`cl-input${errors.confirm ? " error" : ""}`}
                    type="password" placeholder="••••••••"
                    value={form.confirm} onChange={set("confirm")} />
                  {errors.confirm && <div className="cl-error">{errors.confirm}</div>}
                </div>
              )}

              {mode === "login" && (
                <div className="cl-forgot">
                  <a onClick={async () => {
                    if (!form.email.includes('@')) {
                      showToast('Enter your email first', 'error'); return;
                    }
                    const { error } = await supabase.auth.resetPasswordForEmail(form.email);
                    if (error) showToast(error.message, 'error');
                    else showToast('Password reset email sent!');
                  }}>
                    Forgot password?
                  </a>
                </div>
              )}

              <button className="cl-submit" type="submit" disabled={loading}>
                {loading && <span className="cl-loading" />}
                {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="cl-divider">or</div>
            <div className="cl-switch">
              {mode === "login" ? (
                <>Don't have an account?{" "}
                  <a onClick={() => { setMode("signup"); setErrors({}); }}>Sign up</a></>
              ) : (
                <>Already have an account?{" "}
                  <a onClick={() => { setMode("login"); setErrors({}); }}>Sign in</a></>
              )}
            </div>
            <div className="cl-switch" style={{ marginTop: 16 }}>
              Are you an authority?{" "}
              <a onClick={onSwitchToAuth}>Authority login →</a>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`cl-toast${toast.type === "error" ? " error" : ""}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
