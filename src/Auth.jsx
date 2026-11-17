import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

function friendly(ex) {
  const map = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use": "An account with this email already exists. Log in instead.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/operation-not-allowed": "Email/password sign-in is not enabled. Turn it on in Firebase console > Authentication > Sign-in method.",
  };
  return map[ex.code] || ex.message;
}

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", role: "candidate" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, f.email, f.password);
      } else {
        if (!f.name.trim()) throw new Error("Enter your name.");
        const c = await createUserWithEmailAndPassword(auth, f.email, f.password);
        await setDoc(doc(db, "users", c.user.uid), {
          name: f.name.trim(),
          role: f.role,
          createdAt: serverTimestamp(),
        });
      }
    } catch (ex) {
      setErr(friendly(ex));
    }
    setBusy(false);
  }

  return (
    <div className="authwrap">
      <h1>HireBridge</h1>
      <p className="sub">Candidates upload a resume. Employers browse it and send a message.</p>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <>
            <label htmlFor="name">Full name or company name</label>
            <input id="name" value={f.name} onChange={set("name")} />
            <label htmlFor="role">I am a</label>
            <select id="role" value={f.role} onChange={set("role")}>
              <option value="candidate">Candidate looking for work</option>
              <option value="employer">Employer hiring</option>
            </select>
          </>
        )}
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={f.email} onChange={set("email")} required />
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" value={f.password} onChange={set("password")} required />
        {err && <p className="msg err" role="alert">{err}</p>}
        <p>
          <button className="btn" disabled={busy}>{mode === "login" ? "Log in" : "Create account"}</button>
        </p>
      </form>
      <button className="link-dark" onClick={() => { setErr(""); setMode(mode === "login" ? "signup" : "login"); }}>
        {mode === "login" ? "New here? Create an account" : "Already registered? Log in"}
      </button>
    </div>
  );
}
