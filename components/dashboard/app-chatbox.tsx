"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, Loader2, SendHorizontal, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

const initialMessage: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I am your SubSave assistant. Ask me anything about using this app, your subscriptions, trial alerts, usage value, or sharing circles.",
};

const suggestedQuestions = [
  "How can I reduce my monthly subscription spending quickly?",
  "Which subscriptions should I cancel first based on low usage?",
  "How does the Trial Trap Detector work?",
  "What does Cost per use mean in Usage & value?",
  "How can I use Sharing Optimizer to save money?",
  "What categories should I use to keep subscriptions organized?",
  "How do I decide if a subscription is worth keeping?",
  "What is the best weekly routine to manage subscriptions in this app?",
];

export function AppChatbox() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);

  const canSend = useMemo(
    () => message.trim().length > 0 && !isSending,
    [message, isSending]
  );

  async function submitMessage() {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setMessage("");
    setError(null);
    setErrorOpen(false);
    setIsSending(true);

    try {
      const history = nextMessages.slice(0, -1);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      });

      const json = (await res.json()) as {
        reply?: string;
        error?: string;
        providerStatus?: string;
        providerMessage?: string;
      };
      if (!res.ok || !json.reply) {
        throw new Error(json.error ?? "Unable to get a response right now.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: json.reply as string }]);

      if (json.providerStatus) {
        setError(json.providerMessage ?? "The AI provider reported an issue.");
        setErrorOpen(true);
      }
    } catch (submitError) {
      const messageText =
        submitError instanceof Error ? submitError.message : "Unexpected chat error.";
      setError(messageText);
      setErrorOpen(true);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage();
  }

  function handleSuggestionClick(question: string) {
    if (isSending) return;
    setMessage(question);
  }

  return (
    <Card className="card-glow rounded-xl border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">SubSave AI Assistant</CardTitle>
        <CardDescription>
          Chat about how this app works and get help with your subscriptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-border bg-background/40 p-3">
          {messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`flex gap-2 ${item.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {item.role === "assistant" && (
                <span className="mt-1 text-primary">
                  <Bot className="h-4 w-4" />
                </span>
              )}
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  item.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground"
                }`}
              >
                {item.content}
              </div>
              {item.role === "user" && (
                <span className="mt-1 text-muted-foreground">
                  <UserRound className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <Button
                  key={question}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border bg-background/40 text-xs"
                  onClick={() => handleSuggestionClick(question)}
                  disabled={isSending}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) {
                  void submitMessage();
                }
              }
            }}
            rows={3}
            placeholder="Ask about features, trial alerts, costs, or sharing recommendations..."
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isSending}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for a new line.
            </p>
            <Button type="submit" disabled={!canSend} className="btn-gradient rounded-lg">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>

      <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chat Error</DialogTitle>
            <DialogDescription>
              {error ?? "Something went wrong while sending your message."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setErrorOpen(false)} className="btn-gradient rounded-lg">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}