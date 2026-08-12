import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const FUNCTION_URL = 'https://vnmmjmxhtbplfkdughxu.supabase.co/functions/v1/site-guide';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'How do I buy a cask?',
  'Where can I see the casks I own?',
  'How is provenance verified?',
  'I have casks to sell — where do I start?',
];

export const SiteGuideAgent = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useAuth();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    setError(null);
    setInput('');
    const next: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setLoading(true);

    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          context: `Current page: ${location.pathname}. User is ${user ? `signed in with role "${userRole ?? 'consumer'}"` : 'not signed in'}.`,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'The assistant is unavailable right now.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistant = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: assistant };
                return copy;
              });
            }
          } catch {
            /* partial chunk, ignore */
          }
        }
      }

      if (!assistant) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: "I couldn't come up with an answer. Try rephrasing, or visit the [help centre](/help).",
          };
          return copy;
        });
      }
    } catch (e) {
      setMessages((prev) => prev.slice(0, -1));
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const goTo = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          aria-label="Open the ARIGI guide"
          className="fixed bottom-20 right-4 lg:bottom-6 z-40 h-12 w-12 rounded-full p-0 shadow-lg heritage-button"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="ARIGI guide"
          className="fixed bottom-20 right-4 lg:bottom-6 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="font-playfair text-sm font-semibold">ARIGI Guide</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)} aria-label="Close the guide">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="space-y-3 p-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Hello — I can help you find your way around ARIGI. Ask me anything, or start here:
                  </p>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-lg border border-border/60 px-3 py-2 text-left text-sm transition-colors hover:bg-accent/10"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'max-w-[90%] rounded-lg px-3 py-2 text-sm',
                    m.role === 'user'
                      ? 'ml-auto bg-primary/15 text-foreground'
                      : 'mr-auto bg-muted text-foreground',
                  )}
                >
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            const to = href ?? '';
                            if (to.startsWith('/')) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => goTo(to)}
                                  className="font-medium text-primary underline underline-offset-2"
                                >
                                  {children}
                                </button>
                              );
                            }
                            return (
                              <a href={to} target="_blank" rel="noreferrer" className="text-primary underline">
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {m.content || '…'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              ))}

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </ScrollArea>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border/60 p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the site…"
              aria-label="Ask the ARIGI guide"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};
