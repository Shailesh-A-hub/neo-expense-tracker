"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Wallet, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const supabase = createClient();
    const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + "/auth/callback" } });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    if (mode === "signup" && !result.data.session) return setMessage("Account created. Check your email to confirm your address, then sign in.");
    location.href = "/dashboard";
  }
  return <main className="auth-shell"><section className="auth-card">
    <div className="brand"><span className="brand-icon"><Wallet size={22}/></span><span>neo<span className="brand-dot">.</span></span></div>
    <p className="eyebrow">YOUR MONEY, IN PERSPECTIVE</p><h1>{mode === "signin" ? "Welcome back." : "Create your account."}</h1><p className="muted">A calmer, clearer way to manage your finances.</p>
    <form onSubmit={submit}><label>Email address</label><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
    <label>Password</label><div className="password-wrap"><input type={showPassword ? "text" : "password"} required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/><button className="eye" type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
    {message && <p className="form-message">{message}</p>}<button className="primary-btn" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button></form>
    <p className="switch-mode">{mode === "signin" ? "New to Neo?" : "Already have an account?"} <button onClick={()=>{setMode(mode === "signin" ? "signup" : "signin");setMessage("");}}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>
    <p className="secure-note">Your financial data is private and protected by account-level access controls.</p>
  </section><aside className="auth-aside"><div className="orb orb-one"/><div className="orb orb-two"/><p className="eyebrow">LESS FINANCIAL NOISE</p><h2>Know where you stand.<br/><em>Plan where you’re going.</em></h2><p>Track everyday spending and build a complete picture of your wealth — one step at a time.</p><div className="aside-foot">NEO FINANCE · INDIA</div></aside></main>;
}