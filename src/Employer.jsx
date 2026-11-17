import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function Employer({ user, me, onChat }) {
  const [list, setList] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    getDocs(query(collection(db, "profiles"), limit(100)))
      .then((s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((ex) => { setList([]); setErr("Could not load candidates: " + ex.message); });
  }, []);

  async function viewResume(id) {
    const w = window.open("", "_blank"); // opened first so the popup blocker allows it
    try {
      const s = await getDoc(doc(db, "resumes", id));
      if (!s.exists()) throw new Error("This candidate has no resume yet.");
      const bytes = Uint8Array.from(atob(s.data().content), (c) => c.charCodeAt(0));
      w.location = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    } catch (ex) {
      if (w) w.close();
      setErr(ex.message);
    }
  }

  async function message(c) {
    const id = `${c.id}_${user.uid}`;
    try {
      await setDoc(
        doc(db, "conversations", id),
        { participants: [c.id, user.uid], candidateName: c.name, employerName: me.name, updatedAt: serverTimestamp() },
        { merge: true }
      );
      onChat(id);
    } catch (ex) {
      setErr("Could not start the conversation: " + ex.message);
    }
  }

  const term = q.toLowerCase();
  const shown = (list || []).filter((c) =>
    [c.name, c.headline, (c.skills || []).join(" ")].join(" ").toLowerCase().includes(term)
  );

  return (
    <>
      <h2>Browse candidates</h2>
      <p className="sub">Search by name, headline or skill. Open a resume or start a conversation.</p>
      <label htmlFor="q">Search</label>
      <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="python, cloud, data analyst" />
      {err && <p className="msg err" role="alert">{err}</p>}
      {list === null && <p className="msg">Loading candidates…</p>}
      {list && shown.length === 0 && !err && <p className="msg">No candidates match yet. Profiles appear here after candidates save them.</p>}
      <div>
        {shown.map((c) => (
          <div className="row" key={c.id}>
            <div>
              <h3>{c.name}</h3>
              <p>{c.headline}</p>
              <div className="tags">{(c.skills || []).map((s) => <span key={s}>{s}</span>)}</div>
              {c.summary && <p>{c.summary}</p>}
            </div>
            <div className="acts">
              {c.resumeName && <button className="btn ghost" onClick={() => viewResume(c.id)}>View resume</button>}
              <button className="btn" onClick={() => message(c)}>Message</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
