import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const MAX_BYTES = 700 * 1024; // keeps the Base64 copy under Firestore's 1 MiB document limit

export default function Candidate({ user, me }) {
  const [p, setP] = useState({ headline: "", skills: "", summary: "" });
  const [resume, setResume] = useState(null);
  const [msg, setMsg] = useState("");
  const [bad, setBad] = useState(false);

  const say = (text, isErr = false) => { setMsg(text); setBad(isErr); };

  useEffect(() => {
    getDoc(doc(db, "profiles", user.uid))
      .then((s) => {
        if (!s.exists()) return;
        const d = s.data();
        setP({ headline: d.headline || "", skills: (d.skills || []).join(", "), summary: d.summary || "" });
        setResume(d.resumeName || null);
      })
      .catch((ex) => say("Could not load your profile: " + ex.message, true));
  }, [user.uid]);

  async function save(e) {
    e.preventDefault();
    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          name: me.name,
          headline: p.headline.trim(),
          skills: p.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15),
          summary: p.summary.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      say("Profile saved.");
    } catch (ex) {
      say("Could not save: " + ex.message, true);
    }
  }

  async function upload(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return say("Choose a PDF file.", true);
    if (file.size > MAX_BYTES) return say("The PDF must be under 700 KB. Compress it and try again.", true);
    try {
      const content = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      await setDoc(doc(db, "resumes", user.uid), {
        fileName: file.name,
        bytes: file.size,
        content,
        updatedAt: serverTimestamp(),
      });
      await setDoc(
        doc(db, "profiles", user.uid),
        { name: me.name, resumeName: file.name, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setResume(file.name);
      say("Resume uploaded.");
    } catch (ex) {
      say("Upload failed: " + ex.message, true);
    }
  }

  return (
    <>
      <h2>My profile and resume</h2>
      <p className="sub">Employers see your headline, skills, summary and resume. Keep them current.</p>

      <form className="panel" onSubmit={save}>
        <label htmlFor="h">Headline</label>
        <input id="h" value={p.headline} maxLength={100} placeholder="Final-year CS student, cloud and backend" onChange={(e) => setP({ ...p, headline: e.target.value })} />
        <label htmlFor="s">Skills (separate with commas)</label>
        <input id="s" value={p.skills} placeholder="Python, SQL, Google Cloud" onChange={(e) => setP({ ...p, skills: e.target.value })} />
        <label htmlFor="m">Summary</label>
        <textarea id="m" value={p.summary} maxLength={600} onChange={(e) => setP({ ...p, summary: e.target.value })} />
        <p><button className="btn">Save profile</button></p>
      </form>

      <div className="panel">
        <label htmlFor="f">Resume (PDF, under 700 KB)</label>
        <input id="f" type="file" accept="application/pdf" onChange={upload} />
        <p className="msg">{resume ? `Current file: ${resume}. Uploading again replaces it.` : "No resume uploaded yet."}</p>
      </div>

      {msg && <p className={bad ? "msg err" : "msg"} role="status">{msg}</p>}
    </>
  );
}
