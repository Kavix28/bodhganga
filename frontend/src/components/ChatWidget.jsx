// ChatWidget.jsx - Floating AI assistant for BodhGanga
import { useState, useRef, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function formatMessage(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return <li key={i} style={{ marginLeft: "1rem", marginBottom: "2px" }}>{line.slice(2)}</li>;
    }
    if (line.trim() === "") return <br key={i} />;
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ margin: "2px 0" }}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
}

export default function ChatWidget({ isLoggedIn, token }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: isLoggedIn
        ? "Hi! I am your BodhGanga Study Companion. Ask me anything about your exam prep, districts, or quiz yourself!"
        : "Hi! I am the BodhGanga assistant. Ask me about our resources, pricing, or how to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const mode = isLoggedIn ? "study" : "general";
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const buildHistory = () =>
    messages.slice(1, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const endpoint = mode === "study" ? "/ai/study" : "/ai/general";
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text, history: buildHistory() }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply || "Sorry, something went wrong." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title={open ? "Close chat" : "Ask BodhGanga AI"}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
          width: "56px", height: "56px", borderRadius: "50%", border: "none",
          cursor: "pointer", background: "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
          boxShadow: "0 4px 16px rgba(168,120,64,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", fontSize: "24px", transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? "x" : "AI"}
      </button>

      {open && (
        <div style={{
          position: "fixed", bottom: "92px", right: "24px", zIndex: 9998,
          width: "360px", maxWidth: "calc(100vw - 32px)", height: "500px",
          maxHeight: "calc(100vh - 120px)", borderRadius: "16px", background: "#1a1a2e",
          border: "1px solid rgba(200,169,110,0.3)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Segoe UI', sans-serif",
        }}>
          <div style={{
            padding: "14px 16px", background: "linear-gradient(135deg, #c8a96e 0%, #a07840 100%)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "20px" }}>&#x1F4DA;</span>
            <div>
              <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: "14px" }}>
                {mode === "study" ? "Study Companion" : "BodhGanga Assistant"}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(26,26,46,0.7)" }}>
                {mode === "study" ? "Powered by AI - Personalized for you" : "Powered by AI"}
              </div>
            </div>
            {mode === "general" && (
              <div style={{ marginLeft: "auto", fontSize: "11px", color: "rgba(26,26,46,0.8)", textAlign: "right" }}>
                Log in for<br />Study Mode
              </div>
            )}
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: "12px",
            display: "flex", flexDirection: "column", gap: "10px",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%", padding: "10px 13px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "linear-gradient(135deg, #c8a96e, #a07840)" : "rgba(255,255,255,0.08)",
                  color: msg.role === "user" ? "#1a1a2e" : "#e8e8f0", fontSize: "13px", lineHeight: "1.5",
                }}>
                  {msg.role === "assistant" ? <div>{formatMessage(msg.text)}</div> : msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "10px 13px", borderRadius: "16px 16px 16px 4px",
                  background: "rgba(255,255,255,0.08)", color: "#c8a96e", fontSize: "13px",
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex", gap: "8px", alignItems: "flex-end",
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={mode === "study" ? "Ask about your exam prep..." : "Ask about BodhGanga..."}
              rows={1}
              style={{
                flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(200,169,110,0.3)",
                borderRadius: "10px", padding: "8px 12px", color: "#e8e8f0", fontSize: "13px",
                resize: "none", outline: "none", fontFamily: "inherit", lineHeight: "1.4",
                maxHeight: "80px", overflowY: "auto",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: "36px", height: "36px", borderRadius: "10px", border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                background: loading || !input.trim() ? "rgba(200,169,110,0.3)" : "linear-gradient(135deg, #c8a96e, #a07840)",
                color: "#1a1a2e", fontSize: "16px", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </>
  );
}
