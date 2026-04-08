import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const EVENT_OPTIONS = [
  "shot_put", "discus", "javelin",
  "long_jump", "triple_jump", "high_jump", "pole_vault",
  "100m", "200m", "400m", "800m", "1600m", "3200m",
  "100m_hurdles", "110m_hurdles", "300m_hurdles",
];

const eventLabel = (e) => e.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function GeneralFeedbackComposer({ athletes, userEmail, onSent }) {
  const [athleteEmail, setAthleteEmail] = useState("");
  const [event, setEvent] = useState("");
  const [draft, setDraft] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [conversation, setConversation] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleAskAI = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    const newHistory = [...conversation, userMsg];
    setConversation(newHistory);
    setChatInput("");
    setAiLoading(true);

    const res = await base44.functions.invoke("generateAIFeedbackSuggestions", {
      message: chatInput,
      conversationHistory: conversation,
      athleteEmail,
      event,
      currentDraft: draft,
    });

    setAiLoading(false);
    if (res.data?.reply) {
      setConversation([...newHistory, { role: "assistant", content: res.data.reply }]);
    } else {
      toast.error("AI failed to respond.");
    }
  };

  const handleUseSuggestion = (text) => {
    setDraft(text);
    toast.success("Suggestion applied to draft.");
  };

  const handleSend = async () => {
    if (!athleteEmail || !draft.trim()) {
      toast.error("Please select an athlete and write feedback.");
      return;
    }
    setSending(true);
    await base44.entities.GeneralFeedback.create({
      athlete_email: athleteEmail,
      coach_email: userEmail,
      feedback_content: draft,
      event: event || undefined,
      ai_conversation: conversation.length > 0 ? JSON.stringify(conversation) : undefined,
    });
    setSending(false);
    setSent(true);
    toast.success("Feedback sent to athlete!");
    if (onSent) onSent();
    // Reset
    setAthleteEmail("");
    setEvent("");
    setDraft("");
    setConversation([]);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Athlete & Event selectors */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 block">Athlete *</label>
          <select
            value={athleteEmail}
            onChange={(e) => setAthleteEmail(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="">Select athlete...</option>
            {athletes.map(a => (
              <option key={a.email} value={a.email}>{a.full_name || a.email}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 block">Event (optional)</label>
          <select
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="">General / Not specified</option>
            {EVENT_OPTIONS.map(evt => (
              <option key={evt} value={evt}>{eventLabel(evt)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback draft */}
      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1 block">Feedback *</label>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write your feedback for the athlete here..."
          rows={5}
          className="dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
        />
      </div>

      {/* AI Chat section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-gray-200">
            <Bot className="w-4 h-4 text-blue-500" />
            AI Coaching Assistant
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Dialogue with AI to refine your feedback. Ask for drill suggestions, technical cues, or ways to improve your draft.
          </p>

          {/* Conversation */}
          {conversation.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {conversation.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${msg.role === "user" ? "bg-slate-800 text-white" : "bg-blue-50 dark:bg-blue-950 text-slate-700 dark:text-gray-200 border border-blue-100 dark:border-blue-800"}`}>
                    {msg.role === "assistant" ? (
                      <>
                        <ReactMarkdown className="prose prose-xs dark:prose-invert max-w-none">{msg.content}</ReactMarkdown>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-6 text-xs dark:border-gray-600 dark:text-gray-300"
                          onClick={() => handleUseSuggestion(msg.content)}
                        >
                          Use as Draft
                        </Button>
                      </>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> AI is thinking...
                </div>
              )}
            </div>
          )}

          {/* Chat input */}
          <div className="flex gap-2">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI for suggestions, drills, or improvements..."
              rows={2}
              className="flex-1 text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
            />
            <Button
              onClick={handleAskAI}
              disabled={aiLoading || !chatInput.trim()}
              size="sm"
              className="self-end bg-blue-600 hover:bg-blue-700 text-white"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Send button */}
      <Button
        onClick={handleSend}
        disabled={sending || sent || !athleteEmail || !draft.trim()}
        className="w-full gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white"
      >
        {sent ? (
          <><CheckCircle2 className="w-4 h-4" /> Sent!</>
        ) : sending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
        ) : (
          <><Send className="w-4 h-4" /> Send Feedback to Athlete</>
        )}
      </Button>
    </div>
  );
}