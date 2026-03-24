import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {
      // auth.me can fail on private apps; will check role below
    }

    if (!user || (user.role !== 'admin' && user.role !== 'coach')) {
      return Response.json({ error: 'Forbidden: Coach or Admin access required' }, { status: 403 });
    }

    const { video_url, event } = await req.json();

    if (!video_url) {
      return Response.json({ error: 'video_url is required' }, { status: 400 });
    }

    const eventLabel = event ? event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Track & Field';

    const prompt = `You are an expert track and field coach analyzing a ${eventLabel} video. 
Provide detailed, actionable coaching feedback.

Return a JSON object with:
- summary: 2-3 sentence overall assessment
- strengths: array of 2-4 specific positive observations
- areas_for_improvement: array of 2-4 specific technical issues
- drill_recommendations: array of 2-4 specific drills to address the issues
- technical_feedback: object with "body_positioning" and "event_specific_mechanics" keys

Be specific, practical, and constructive. Focus on what you can observe in the video.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [video_url],
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' } },
          areas_for_improvement: { type: 'array', items: { type: 'string' } },
          drill_recommendations: { type: 'array', items: { type: 'string' } },
          technical_feedback: {
            type: 'object',
            properties: {
              body_positioning: { type: 'string' },
              event_specific_mechanics: { type: 'string' },
            },
          },
        },
      },
    });

    return Response.json({ analysis: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});