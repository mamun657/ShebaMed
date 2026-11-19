"use client";
import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Send,
  ArrowUpRight,
  Loader2,
  RotateCcw,
  Sparkles,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "./ui/button";
import { api } from "./auth-form";
import { Localize, translate, useI18n } from "@/lib/i18n";

export type ChatSource = {
  documentId: string;
  page: number;
  quote: string;
  filename: string;
  reportDate: string | null;
  category: string;
  verification: string;
  documentSource?: string;
  organizationName?: string;
  url: string;
};

export type ChatAnswer = {
  answer: string;
  sources: ChatSource[];
  intent: string;
  pendingDocuments: number;
  usedModel: boolean;
};

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  intent?: string;
  pendingDocuments?: number;
  error?: boolean;
};

const exampleQuestions = [
  "Have I done an HbA1c test before?",
  "Which medical tests did I perform in 2026?",
  "What was my previous CBC result?",
  "Show me the original report.",
];

const label = (value: string) => value.toLowerCase().replaceAll("_", " ");
const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Report date not available";

export function AiAssistant({
  suffix,
  target,
  disabled,
  aiPermissionMissing,
  role,
}: {
  suffix: string;
  target?: string;
  disabled: boolean;
  aiPermissionMissing: boolean;
  role?: string;
}) {
  const { locale } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState(locale === "bn" ? "Bangla" : "English");
  const [languageOverridden, setLanguageOverridden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const suggestions =
    role === "pharmacy"
      ? [
          "Has this patient previously been prescribed this medicine?",
          "Was this medicine previously dispensed?",
          "What relevant history is in the authorized records?",
          "Show a source document.",
        ]
      : exampleQuestions;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  useEffect(() => {
    if (!languageOverridden)
      setLanguage(locale === "bn" ? "Bangla" : "English");
  }, [locale, languageOverridden]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setFailed(false);
    setQuestion("");
    const userMessage: ChatMessage = {
      id: nextId.current++,
      role: "user",
      text: trimmed,
    };
    setMessages((current) => [...current, userMessage]);
    setBusy(true);
    try {
      const result = (await api("ai" + suffix, "POST", {
        question: trimmed,
        language,
      })) as ChatAnswer;
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          text: result.answer,
          sources: result.sources,
          intent: result.intent,
          pendingDocuments: result.pendingDocuments,
        },
      ]);
    } catch (error) {
      setFailed(true);
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          text: (error as Error).message,
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Localize>
    <div className="panel ai-panel">
      <span className="round-icon">
        <MessageSquare size={30} />
      </span>
      <h2>
        {role === "pharmacy"
          ? "Authorized history has answers."
          : "Your history has answers."}
      </h2>
      <p>
        Ask about a previous report. Answers are grounded in the records you can
        access, and every clinical claim cites its source document and page.
      </p>
      {aiPermissionMissing && (
        <div className="notice">
          AI clinical memory is not part of your current permission for this
          patient. Ask the patient to approve the “query medical history”
          capability when they approve your access.
        </div>
      )}
      {role === "pharmacy" && (
        <div className="notice">
          Historical lookup only. The assistant does not diagnose, recommend,
          prescribe, or approve medicines.
        </div>
      )}
      <div className="chat-thread" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <Sparkles size={22} />
            <h3>Start with a question about your records</h3>
            <p>
              Greetings and questions about how ShebaMed works are answered
              instantly, without searching your medical history.
            </p>
            <div className="suggestions">
              {suggestions.map((example) => (
                <button
                  key={example}
                  onClick={() => void ask(translate(example, locale))}
                  disabled={disabled || busy}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) =>
          message.role === "user" ? (
            <div className="chat-message user" key={message.id}>
              <p className="medical-content">{message.text}</p>
            </div>
          ) : (
            <div className="chat-message assistant" key={message.id}>
              {message.error && (
                <span className="chat-error-tag">
                  <AlertTriangle size={14} /> Request failed
                </span>
              )}
              <p>{message.text}</p>
              {!!message.pendingDocuments && (
                <div className="notice chat-notice">
                  {locale === "bn"
                    ? `${message.pendingDocuments}টি নথি এখনও প্রক্রিয়াধীন, তাই এই ইতিহাস অসম্পূর্ণ হতে পারে।`
                    : `${message.pendingDocuments} document${
                        message.pendingDocuments === 1 ? " is" : "s are"
                      } still processing, so this history may be incomplete.`}
                </div>
              )}
              {!!message.sources?.length && (
                <div className="chat-sources">
                  {message.sources.map((source, index) => (
                    <div className="citation" key={index}>
                      <strong>
                        <FileText size={14} />{" "}
                        <span translate="no">{source.filename}</span> · Page{" "}
                        {source.page}
                      </strong>
                      <small>
                        {date(source.reportDate)} · {label(source.category)} ·{" "}
                        {label(source.verification)}
                        {source.organizationName
                          ? ` · ${source.documentSource || "Pharmacy record"}: ${source.organizationName}`
                          : ""}
                      </small>
                      <blockquote className="medical-content">
                        {source.quote}
                      </blockquote>
                      <a href={source.url}>
                        {source.url.startsWith("/api/records/")
                          ? "Open original report"
                          : "Open digital record"}{" "}
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
        )}
        {busy && (
          <div className="chat-message assistant">
            <span className="chat-loading">
              <Loader2 size={15} className="spin" /> Searching authorized
              evidence…
            </span>
          </div>
        )}
      </div>
      {failed && (
        <div className="error chat-retry">
          <span>The last question could not be completed.</span>
          <Button
            variant="outline"
            size="small"
            onClick={() => {
              const lastUser = [...messages]
                .reverse()
                .find((message) => message.role === "user");
              if (lastUser) void ask(lastUser.text);
            }}
          >
            <RotateCcw size={15} /> Retry
          </Button>
        </div>
      )}
      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <div className="chat-input">
          <input
            id="question"
            name="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={disabled || busy}
            required
            minLength={3}
            maxLength={1000}
            aria-label="Ask a question about your medical history"
            placeholder="Ask about your medical history…"
          />
          <Button disabled={busy || !target || !question.trim()}>
            <Send size={18} />
            <span className="sr-only">Send question</span>
          </Button>
        </div>
        <label className="language-choice">
          Answer language
          <select
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value);
              setLanguageOverridden(true);
            }}
          >
            <option value="English">English</option>
            <option value="Bangla">বাংলা</option>
          </select>
        </label>
      </form>
      <small className="ai-disclaimer">
        History retrieval, not diagnosis or treatment advice. Verify against
        original reports. Patient confirmations are not clinician verification.
      </small>
    </div>
    </Localize>
  );
}
