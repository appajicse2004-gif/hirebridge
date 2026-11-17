import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import Auth from "./Auth";
import Candidate from "./Candidate";
import Employer from "./Employer";
import Chat from "./Chat";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [me, setMe] = useState(undefined); // undefined = loading, null = missing
  const [tab, setTab] = useState("main");
  const [chatId, setChatId] = useState(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (!u) setMe(undefined);
      }),
    []
  );

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, "users", user.uid),
      (s) => setMe(s.exists() ? s.data() : undefined),
      () => setMe(null)
    );
  }, [user]);

  // If the account document never appears (failed sign-up), stop waiting.
  useEffect(() => {
    if (!user || me !== undefined) return;
    const t = setTimeout(() => setMe(null), 6000);
    return () => clearTimeout(t);
  }, [user, me]);

  if (user === undefined) return <p className="note">Loading…</p>;
  if (!user) return <Auth />;
  if (me === undefined) return <p className="note">Setting up your account…</p>;
  if (me === null)
    return (
      <div className="note">
        <p>Your account is missing its profile record. Sign out and create the account again with a different email.</p>
        <button className="btn" onClick={() => signOut(auth)}>Sign out</button>
      </div>
    );

  const employer = me.role === "employer";
  const openChat = (id) => { setChatId(id); setTab("chat"); };

  return (
    <div className="shell">
      <aside>
        <h1>HireBridge</h1>
        <p className="who">{me.name}<br /><span>{employer ? "Employer" : "Candidate"}</span></p>
        <nav>
          <button className={tab === "main" ? "on" : ""} onClick={() => setTab("main")}>
            {employer ? "Browse candidates" : "My profile and resume"}
          </button>
          <button className={tab === "chat" ? "on" : ""} onClick={() => setTab("chat")}>Messages</button>
        </nav>
        <button className="link" onClick={() => signOut(auth)}>Sign out</button>
      </aside>
      <main>
        {tab === "chat" ? (
          <Chat user={user} me={me} initialId={chatId} />
        ) : employer ? (
          <Employer user={user} me={me} onChat={openChat} />
        ) : (
          <Candidate user={user} me={me} />
        )}
      </main>
    </div>
  );
}
