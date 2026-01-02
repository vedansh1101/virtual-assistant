import { useEffect, useRef, useState } from "react";

const COOLDOWN_MS = 3000;

export default function VirtualAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [dark, setDark] = useState(false);

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) =>
      setInput((prev) => prev + " " + e.results[0][0].transcript);

    recognition.start();
    recognitionRef.current = recognition;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    if (Date.now() - lastSentRef.current < COOLDOWN_MS) {
      alert("Please wait a moment before sending again.");
      return;
    }
    lastSentRef.current = Date.now();

    const userMsg = {
      role: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply || "No response from AI",
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "⚠ Error connecting to AI. Try again later.",
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm("Clear entire chat?")) {
      setMessages([]);
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

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <div className="flex justify-between items-center p-4 bg-blue-600 text-white shadow-lg">
        <h1 className="font-semibold text-lg">🤖 Virtual Assistant</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setDark(!dark)}
            className="hover:bg-blue-700 px-3 py-1 rounded transition"
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <button 
            onClick={exportChat}
            className="hover:bg-blue-700 px-3 py-1 rounded transition"
            disabled={messages.length === 0}
          >
            ⬇
          </button>
          <button 
            onClick={clearChat}
            className="hover:bg-blue-700 px-3 py-1 rounded transition"
            disabled={messages.length === 0}
          >
            🗑
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <div className="text-6xl mb-4">👋</div>
            <div className="text-xl">Start a conversation</div>
            <div className="text-sm mt-2">Ask me anything!</div>
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
              className={`relative max-w-md px-4 py-2 rounded-2xl text-sm shadow-md
              ${
                m.role === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.text}</div>
              <div className="text-[10px] opacity-60 mt-1">{m.time}</div>
              <button
                onClick={() => copyText(m.text)}
                className="absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                📋
              </button>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl rounded-bl-none shadow-md">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shadow-lg">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <button
            onClick={startListening}
            className={`text-2xl px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
              listening ? "animate-pulse bg-red-100 dark:bg-red-900" : ""
            }`}
          >
            🎤
          </button>

          <div className="flex-1 relative">
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
              className="w-full resize-none rounded-lg px-4 py-2 border dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Type your message…"
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {input.length}/500
            </div>
          </div>

          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}



