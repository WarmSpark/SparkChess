import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

const PRESET_MESSAGES = ['Good game!', 'Good luck!', 'Well played!', 'Thanks!'];

export default function Chat({ messages, onSendMessage, disabled = false }: ChatProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handlePreset = (preset: string) => {
    if (disabled) return;
    onSendMessage(preset);
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: 280,
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--text-secondary)',
        letterSpacing: 0.5,
      }}>
        GAME CHAT
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>
            No messages yet. Say hi!
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{msg.sender}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2, wordBreak: 'break-word' }}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '6px 10px',
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        borderTop: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.15)',
      }}>
        {PRESET_MESSAGES.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => handlePreset(preset)}
            disabled={disabled}
            style={{ fontSize: 11, padding: '3px 8px', whiteSpace: 'nowrap' }}
          >
            {preset}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', padding: 8, gap: 6, borderTop: '1px solid var(--border)' }}>
        <input
          className="input"
          placeholder="Send a message..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          disabled={disabled}
          style={{ padding: '8px 12px', fontSize: 13 }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={disabled || !inputText.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
