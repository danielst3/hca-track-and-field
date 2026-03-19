import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'coach') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { analysis_id, question, video_url, event, prior_analysis } = await req.json();

    if (!analysis_id || !question) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const eventLabel = (event || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const prompt = `You are an expert track and field coach specializing in ${eventLabel}.

Here is the prior AI analysis for an athlete's video (video URL: ${video_url || 'N/A'}):
${prior_analysis}

The coach is now asking a follow-up question:
"${question}"

Please respond as a helpful expert coaching assistant. Be concise and practical. If the coach is asking for more detail on a specific area, provide it. If they're asking for additional drills or corrections, provide those.`;

    const aiResult = await base44.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ success: true, response: aiResult });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});