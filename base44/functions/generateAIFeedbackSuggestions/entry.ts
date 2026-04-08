import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'coach')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { message, conversationHistory, athleteEmail, event, currentDraft } = await req.json();

    const systemPrompt = `You are an expert track and field coaching assistant helping a coach draft clear, actionable feedback for an athlete.
The athlete's email is: ${athleteEmail || 'unspecified'}.
The event is: ${event ? event.replace(/_/g, ' ') : 'unspecified'}.
Current draft feedback: ${currentDraft || '(none yet)'}

Help the coach refine their feedback. Suggest improvements, ask clarifying questions, or propose specific technical cues and drill recommendations. Be concise and practical.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: JSON.stringify(messages),
      add_context_from_internet: false,
    });

    return Response.json({ success: true, reply: response });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});