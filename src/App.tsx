import React, { useState, useRef, useEffect } from 'react';
import { Send, LogOut, Bot, AlertCircle, Loader2 } from 'lucide-react';

// ── CONFIG ──
const SUPABASE_URL     = 'https://wiavnyuchdsfztzhvaua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpYXZueXVjaGRzZnp0emh2YXVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDI2ODQsImV4cCI6MjA4NjU3ODY4NH0.dXz7vyFglA_lihma__rbtBT8afZZ1YUJEkAmqpFOL6c';
const N8N_WEBHOOK_URL  = 'https://gpixie.app.n8n.cloud/webhook/73c8cf09-d134-445b-950a-94a8eccbe4f8';

// ── TYPES ──
interface UserInfo { id: string; first_name: string; last_name: string; email: string; }
interface ChatMsg  { id: string; role: 'user' | 'agent' | 'system'; text: string; }

// ── MARKDOWN ──
function renderMd(text: string): React.ReactNode {
  return text.split(/\n\n+/).map((para, pi) => {
    const lines = para.split('\n');
    const isList = lines.every(l => /^[-*]\s/.test(l.trim()) || l.trim() === '');
    if (isList) {
      return (
        <ul key={pi} style={{ listStyle: 'none', margin: '6px 0', padding: 0 }}>
          {lines.filter(l => /^[-*]\s/.test(l.trim())).map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <span style={{ color: 'var(--blue-bright)', flexShrink: 0 }}>•</span>
              <span>{inlineFmt(item.replace(/^[-*]\s*/, ''))}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p key={pi} style={{ margin: pi > 0 ? '8px 0 0' : 0 }}>
        {lines.map((ln, li) => (
          <React.Fragment key={li}>{li > 0 && <br />}{inlineFmt(ln)}</React.Fragment>
        ))}
      </p>
    );
  });
}

function inlineFmt(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

// ── APP ──
export default function App() {
  const [user,         setUser]         = useState<UserInfo | null>(null);
  const [email,        setEmail]        = useState('');
  const [pwd,          setPwd]          = useState('');
  const [loginErr,     setLoginErr]     = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [focused,      setFocused]      = useState<string | null>(null);
  const [messages,     setMessages]     = useState<ChatMsg[]>([]);
  const [input,        setInput]        = useState('');
  const [sending,      setSending]      = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !pwd.trim()) { setLoginErr('Please enter email and password.'); return; }
    setLoginLoading(true); setLoginErr('');
    try {
      const res  = await fetch(`${SUPABASE_URL}/rest/v1/customers?email=eq.${encodeURIComponent(email.trim())}&select=id,first_name,last_name,email,password`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
      const data = await res.json();
      if (!data.length)               setLoginErr('No account found.');
      else if (data[0].password!==pwd) setLoginErr('Incorrect password.');
      else {
        const { password: _, ...u } = data[0];
        setUser(u);
        setMessages([{ id: 'w', role: 'agent', text: `Hello ${u.first_name}! How can I help you today?` }]);
      }
    } catch { setLoginErr('Connection error. Please try again.'); }
    finally  { setLoginLoading(false); }
  };

  const logout = () => { setUser(null); setMessages([]); setEmail(''); setPwd(''); };

  const send = async () => {
    if (!input.trim() || sending) return;
    const txt = input.trim();
    setMessages(p => [...p, { id: Date.now().toString(), role: 'user', text: txt }]);
    setInput(''); setSending(true);
    try {
      const res  = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendMessage', chatInput: txt, customer_id: user?.id ?? '' }),
      });
      const data = await res.json();
      const reply = data.output ?? data.text ?? data.response ?? data.message ?? JSON.stringify(data);
      setMessages(p => [...p, { id: (Date.now()+1).toString(), role: 'agent', text: reply }]);
    } catch {
      setMessages(p => [...p, { id: (Date.now()+1).toString(), role: 'system', text: 'Failed to send. Please try again.' }]);
    } finally { setSending(false); }
  };

  const fieldStyle = (name: string): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '13px 16px',
    background: 'var(--surface2)',
    border: `1.5px solid ${focused===name ? 'var(--blue-bright)' : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 12,
    color: 'var(--text)', fontSize: 15,
    fontFamily: 'var(--font-sf)',
    outline: 'none',
    transition: 'border-color 0.15s',
  });

  // ── LOGIN ──
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div
          className="glass-card"
          style={{
            width: '100%', maxWidth: 400,
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            boxShadow: '0 28px 80px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            animation: 'fade-up 0.35s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          {/* Header */}
          <div style={{ padding: '44px 40px 28px', textAlign: 'center' }}>
            <div style={{
              width: 78, height: 78, borderRadius: '50%',
              background: 'linear-gradient(150deg,#1a8cff,#0050c8)',
              margin: '0 auto 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 36px var(--blue-glow)',
            }}>
              <Bot style={{ width: 40, height: 40, color: '#fff' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-sf-display)', fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', margin: '0 0 8px' }}>
              JM20 Support
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: 15, margin: 0 }}>Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={login} style={{ padding: '0 40px 44px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <input type="email"    value={email} onChange={e=>setEmail(e.target.value)}
                onFocus={()=>setFocused('email')}    onBlur={()=>setFocused(null)}
                placeholder="Email"    autoComplete="email"            style={fieldStyle('email')} />
              <input type="password" value={pwd}   onChange={e=>setPwd(e.target.value)}
                onFocus={()=>setFocused('pwd')}      onBlur={()=>setFocused(null)}
                placeholder="Password" autoComplete="current-password" style={fieldStyle('pwd')} />
            </div>

            {loginErr && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 14,
                background: 'rgba(255,69,58,0.12)',
                border: '1px solid rgba(255,69,58,0.25)',
                borderRadius: 10, color: 'var(--red)', fontSize: 13,
              }}>
                <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                {loginErr}
              </div>
            )}

            <button type="submit" disabled={loginLoading} style={{
              width: '100%', padding: '14px',
              background: loginLoading ? 'rgba(0,113,227,0.6)' : 'var(--blue)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 17, fontWeight: 600,
              fontFamily: 'var(--font-sf)',
              cursor: loginLoading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}>
              {loginLoading && <Loader2 style={{ width: 17, height: 17 }} className="spin" />}
              {loginLoading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── CHAT ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        className="glass-card"
        style={{
          width: '100%', maxWidth: 680,
          height: '84vh', maxHeight: 740,
          display: 'flex', flexDirection: 'column',
          background: 'var(--glass)',
          border: '1px solid var(--glass-border)',
          borderRadius: 20,
          boxShadow: '0 28px 80px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          animation: 'fade-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Nav */}
        <div className="glass-bar" style={{
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--sep)',
          background: 'rgba(28,28,30,0.65)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(150deg,#1a8cff,#0050c8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px var(--blue-glow)', flexShrink: 0,
            }}>
              <Bot style={{ width: 21, height: 21, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-sf-display)', fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.2px' }}>
                JM20 Support
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px #30D15888', display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{user.first_name} {user.last_name}</span>
              </div>
            </div>
          </div>
          <button onClick={logout} style={{
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--sep)',
            borderRadius: 8, color: 'var(--text-2)', fontSize: 13,
            fontFamily: 'var(--font-sf)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <LogOut style={{ width: 13, height: 13 }} /> Sign Out
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: 'auto',
          padding: '18px 18px',
          display: 'flex', flexDirection: 'column', gap: 2,
          background: 'var(--bg)',
        }}>
          {messages.map((m, idx) => {
            const isUser   = m.role === 'user';
            const isSystem = m.role === 'system';
            const gap      = idx > 0 && messages[idx-1].role !== m.role;

            if (isSystem) return (
              <div key={m.id} style={{
                alignSelf: 'center', padding: '7px 14px', margin: '8px 0',
                background: 'rgba(255,69,58,0.12)', border: '1px solid rgba(255,69,58,0.22)',
                borderRadius: 10, color: 'var(--red)', fontSize: 12,
              }}>{m.text}</div>
            );

            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginTop: gap ? 14 : 2 }}>
                <div style={{
                  maxWidth: '72%', padding: '10px 14px',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isUser ? 'var(--blue-bright)' : 'var(--surface2)',
                  color: 'var(--text)', fontSize: 15, lineHeight: 1.45,
                }}>
                  {m.role === 'agent' ? renderMd(m.text) : m.text}
                </div>
              </div>
            );
          })}

          {sending && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 14 }}>
              <div style={{ padding: '13px 18px', background: 'var(--surface2)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,160,320].map((d,i) => (
                  <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-3)', display: 'inline-block', animation: `bounce-dot 1.3s ease-in-out ${d}ms infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="glass-bar" style={{ padding: '12px 16px', borderTop: '1px solid var(--sep)', background: 'rgba(28,28,30,0.85)', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface2)', borderRadius: 22,
            padding: '8px 8px 8px 18px',
            border: '1px solid var(--sep)',
          }}>
            <input
              type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && send()}
              placeholder="Message…" disabled={sending}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--text)', fontSize: 15, fontFamily: 'var(--font-sf)',
                padding: '4px 0', opacity: sending ? 0.5 : 1,
              }}
            />
            <button onClick={send} disabled={sending || !input.trim()} style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: (!sending && input.trim()) ? 'var(--blue-bright)' : 'var(--surface3)',
              cursor: (!sending && input.trim()) ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}>
              <Send style={{ width: 15, height: 15, color: (!sending && input.trim()) ? '#fff' : 'var(--text-3)' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
