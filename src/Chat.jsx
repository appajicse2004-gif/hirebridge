import { useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase";

export default function Chat({ user, me, initialId }) {
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(initialId);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const end = useRef(null);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "conversations"), where("participants", "array-contains", user.uid)),
        (s) =>
          setConvos(
            s.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
          ),
        (ex) => setErr(ex.message)
      ),
    [user.uid]
  );

  useEffect(() => {
    if (!active) return setMsgs([]);
    return onSnapshot(
      query(collection(db, "conversations", active, "messages"), orderBy("createdAt")),
      (s) => setMsgs(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (ex) => setErr(ex.message)
    );
  }, [active]);

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs]);

  async function send(e) {
    e.preventDefault();
    const t = text.trim().slice(0, 1000);
    if (!t || !active) return;
    setText("");
    try {
      await addDoc(collection(db, "conversations", active, "messages"), {
        senderId: user.uid,
        senderName: me.name,
        text: t,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "conversations", active), { lastMessage: t.slice(0, 80), updatedAt: serverTimestamp() });
    } catch (ex) {
      setErr("Message not sent: " + ex.message);
    }
  }

  const other = (c) => (user.uid === c.participants[0] ? c.employerName : c.candidateName);

  return (
    <>
      <h2>Messages</h2>
      <p className="sub">Employers start conversations from the candidate list. Candidates reply here.</p>
      {err && <p className="msg err" role="alert">{err}</p>}
      <div className="chat">
        <div className="convos">
          {convos.length === 0 && <p className="msg" style={{ padding: 14 }}>No conversations yet.</p>}
          {convos.map((c) => (
            <button key={c.id} className={c.id === active ? "on" : ""} onClick={() => setActive(c.id)}>
              <strong>{other(c)}</strong>
              <small>{c.lastMessage || "No messages yet"}</small>
            </button>
          ))}
        </div>
        <div className="thread">
          <div className="log">
            {!active && <p className="msg">Select a conversation.</p>}
            {msgs.map((m) => (
              <div key={m.id} className={m.senderId === user.uid ? "bubble mine" : "bubble"}>{m.text}</div>
            ))}
            <div ref={end} />
          </div>
          {active && (
            <form className="send" onSubmit={send}>
              <input aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" />
              <button className="btn">Send</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
