import React, { useState } from 'react';
import { API_URL } from '../config'; 
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hello! I am LifeDrop AI. How can I help you today?' }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user', text: input };
    setMessages([...messages, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Server error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      {/* Floating Button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="bg-red-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition animate-bounce">
          <MessageSquare size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-[350px] h-[500px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom duration-300">
          <div className="bg-red-600 p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
               <Bot size={24} />
               <span className="font-black italic tracking-tighter">LifeDrop AI</span>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={20}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-bold shadow-sm ${msg.role === 'user' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <p className="text-[10px] font-black text-gray-400 animate-pulse uppercase">AI is thinking...</p>}
          </div>

          <div className="p-4 bg-white border-t flex gap-2">
            <input 
              className="flex-1 bg-gray-100 p-3 rounded-xl text-sm outline-none font-bold"
              placeholder="Ask about blood stock, health..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className="bg-red-600 text-white p-3 rounded-xl"><Send size={18}/></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;