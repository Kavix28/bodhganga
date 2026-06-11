import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function formatMessage(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return <li key={i} style={{ marginLeft: "1.2rem", marginBottom: "4px" }}>{line.slice(2)}</li>;
    }
    if (line.trim() === "") return <br key={i} />;
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ margin: "3px 0" }}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    );
  });
}

const SUGGESTED_PROMPTS = [
  "What are the top 5 topics for my district exam?",
  "Quiz me with 3 MCQs on local history",
  "Give me a study plan for the next 2 weeks",
  "What are the important rivers and passes in my district?",
  "Explain the administrative structure of my district",
];

export default function AiCompanionPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaste! I am your BodhGanga Study Companion. I know your purchased districts and can help you prepare for your state competitive exam. Ask me anything — topics, MCQs, study plans, or concept explanations!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildHistory = () =>
    messages.slice(1, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/study`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg, history: buildHistory() }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || "Sorry, something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f1a",
      display: "flex", flexDirection: "column", fontFamily: "'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 24px", background: "#1a1a2e",
        borderBottom: "1px solid rgba(200,169,110,0.2)",
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", color: "#c8a96e",
          cursor: "pointer", fontSize: "20px", padding: "0 8px 0 0",
        }}>&#8592;</button>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: "linear-gradient(135deg, #c8a96e, #a07840)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
        }}>&#x1F4DA;</div>
        <div>
          <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: "16px" }}>Study Companion</div>
          <div style={{ color: "#c8a96e", fontSize: "12px" }}>AI-powered exam prep</div>
        </div>
        <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
          Powered by Gemini
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", maxWidth: "800px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: "16px",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #c8a96e, #a07840)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", marginRight: "10px", alignSelf: "flex-end",
              }}>&#x1F4DA;</div>
            )}
            <div style={{
              maxWidth: "75%", padding: "12px 16px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #c8a96e, #a07840)"
                : "rgba(255,255,255,0.07)",
              color: msg.role === "user" ? "#1a1a2e" : "#e8e8f0",
              fontSize: "14px", lineHeight: "1.6",
              border: msg.role === "assistant" ? "1px solid rgba(200,169,110,0.15)" : "none",
            }}>
              {msg.role === "assistant" ? <div>{formatMessage(msg.text)}</div> : msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "linear-gradient(135deg, #c8a96e, #a07840)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
            }}>&#x1F4DA;</div>
            <div style={{
              padding: "12px 16px", borderRadius: "18px 18px 18px 4px",
              background: "rgba(255,255,255,0.07)", color: "#c8a96e", fontSize: "14px",
              border: "1px solid rgba(200,169,110,0.15)",
            }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* Suggested prompts — show only at start */}
        {messages.length === 1 && (
          <div style={{ marginTop: "8px" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "10px" }}>
              Try asking:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)} style={{
                  background: "rgba(200,169,110,0.1)", border: "1px solid rgba(200,169,110,0.3)",
                  borderRadius: "20px", padding: "6px 14px", color: "#c8a96e",
                  fontSize: "12px", cursor: "pointer", transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(200,169,110,0.2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(200,169,110,0.1)"}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "16px", background: "#1a1a2e",
        borderTop: "1px solid rgba(200,169,110,0.2)",
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about topics, request a quiz, get a study plan..."
            rows={1}
            style={{
              flex: 1, background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(200,169,110,0.3)", borderRadius: "12px",
              padding: "12px 16px", color: "#e8e8f0", fontSize: "14px",
              resize: "none", outline: "none", fontFamily: "inherit",
              lineHeight: "1.5", maxHeight: "120px",
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              padding: "12px 20px", borderRadius: "12px", border: "none",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              background: loading || !input.trim()
                ? "rgba(200,169,110,0.3)"
                : "linear-gradient(135deg, #c8a96e, #a07840)",
              color: "#1a1a2e", fontWeight: 700, fontSize: "14px",
              flexShrink: 0, transition: "opacity 0.2s",
            }}
          >
            Send
          </button>
        </div>
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "11px", marginTop: "8px", maxWidth: "800px", margin: "8px auto 0" }}>
          AI can make mistakes. Verify important facts from official sources.
        </div>
      </div>
    </div>
  );
}
