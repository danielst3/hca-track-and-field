import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Support() {
  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const admins = await base44.entities.User.filter({ role: "admin" });
    await Promise.all(
      admins.map((admin) =>
        base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `Support Request: ${subject}`,
          body: `From: ${user?.full_name} (${user?.email})\n\n${message}`,
        })
      )
    );
    setSent(true);
    setSending(false);
    setSubject("");
    setMessage("");
    toast.success("Message sent!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-lg mx-auto pt-8">
        <div className="text-center mb-8">
          <MessageSquare className="w-12 h-12 text-[var(--brand-primary)] dark:text-gray-300 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100">Support</h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">Have a question or issue? Send a message to the coaching staff.</p>
        </div>

        {sent ? (
          <Card className="bg-white dark:bg-gray-800 dark:border-gray-700 text-center">
            <CardContent className="pt-10 pb-10">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">Message Sent!</h2>
              <p className="text-slate-600 dark:text-gray-400 mb-6">The coaching staff will get back to you soon.</p>
              <Button onClick={() => setSent(false)} variant="outline" className="dark:bg-gray-700 dark:text-gray-200">
                Send Another
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Contact Coaching Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="dark:text-gray-200">Your Name</Label>
                  <Input value={user?.full_name || ""} disabled className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" />
                </div>
                <div className="space-y-1">
                  <Label className="dark:text-gray-200">Subject</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Question about practice plan"
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="dark:text-gray-200">Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question or issue..."
                    rows={5}
                    required
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}