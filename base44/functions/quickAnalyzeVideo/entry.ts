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
Analyze the attached video carefully and provide detailed, actionable coaching feedback based on what you observe.
Focus on technique, body mechanics, and specific improvements.
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
        required: ['summary', 'strengths', 'areas_for_improvement', 'drill_recommendations', 'technical_feedback'],
      },
    });

    const today = new Date().toISOString().split('T')[0];
    const aiStr = typeof result === 'string' ? result : JSON.stringify(result);
    const analysisRecord = await base44.asServiceRole.entities.VideoAnalysisResult.create({
      athlete_email: user.email,
      event: event || 'shot_put',
      video_url,
      ai_response: aiStr,
      coach_feedback: aiStr,
      status: 'pending_review',
      analysis_date: today,
    });

    return Response.json({ analysis: result, record_id: analysisRecord.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});