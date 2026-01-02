import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "va_messages";
const THEME_KEY = "va_theme";

export default function VirtualAssistant() {
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [dark, setDark] = useState(
    localStorage.getItem(THEME_KEY) === "dark"
  );

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  /* ------------------ EFFECTS ------------------ */

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  /* ------------------ SPEECH ------------------ */

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) =>
      setInput((prev) => prev + e.results[0][0].transcript);

    recognition.start();
    recognitionRef.current = recognition;
  };

  /* ------------------ CHAT ------------------ */

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      role: "user",
      text: input,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply || "No response",
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "❌ Error connecting to AI", time: "" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ UTILITIES ------------------ */

  const clearChat = () => {
    if (confirm("Clear entire chat?")) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const exportChat = () => {
    const text = messages
      .map((m) => `[${m.time}] ${m.role}: ${m.text}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chat.txt";
    a.click();
  };

  const copyText = (text) => navigator.clipboard.writeText(text);

  /* ------------------ UI ------------------ */

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-blue-600 text-white">
        <h1 className="font-semibold text-lg">🤖 Virtual Assistant</h1>
        <div className="space-x-3">
          <button onClick={() => setDark(!dark)}>🌓</button>
          <button onClick={exportChat}>⬇</button>
          <button onClick={clearChat}>🗑</button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            👋 Start a conversation
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`relative max-w-md px-4 py-2 rounded-2xl text-sm shadow
              ${
                m.role === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none"
              }`}
            >
              {m.text}
              <div className="text-[10px] opacity-60 mt-1">{m.time}</div>
              <button
                onClick={() => copyText(m.text)}
                className="absolute -top-2 -right-2 text-xs"
              >
                📋
              </button>
            </div>
          </div>
        ))}

        {loading && (
          <div className="animate-pulse text-gray-500">AI is typing…</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t flex items-center gap-2">
        <button
          onClick={startListening}
          className={`text-xl ${listening ? "animate-pulse" : ""}`}
        >
          🎤
        </button>

        <textarea
          value={input}
          rows={1}
          maxLength={500}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="flex-1 resize-none rounded-lg px-3 py-2 border focus:outline-none dark:bg-gray-700"
          placeholder="Type your message…"
        />

        <div className="text-xs text-gray-500">{input.length}/500</div>

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

