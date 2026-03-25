import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const body = await req.json();

    // Support both direct call (record_id) and entity automation payload (event.entity_id)
    const record_id = body.record_id || body.event?.entity_id;

    if (!record_id) {
      return Response.json({ error: 'record_id is required' }, { status: 400 });
    }

    const record = await base44.asServiceRole.entities.VideoAnalysisResult.get(record_id);
    if (!record) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    // Only process records in 'processing' state
    if (record.status !== 'processing') {
      return Response.json({ skipped: true, reason: 'Not in processing state' });
    }

    const { video_url, event } = record;
    const eventLabel = event ? event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Track & Field';

    const prompt = `You are an expert track and field coach analyzing a ${eventLabel} video.
Analyze the attached video carefully and provide detailed, actionable coaching feedback based on what you observe.
Focus on technique, body mechanics, and specific improvements.
Be specific, practical, and constructive. Focus on what you can observe in the video.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
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

    const aiStr = typeof result === 'string' ? result : JSON.stringify(result);
    await base44.asServiceRole.entities.VideoAnalysisResult.update(record_id, {
      ai_response: aiStr,
      coach_feedback: aiStr,
      status: 'pending_review',
    });

    return Response.json({ success: true });
  } catch (error) {
    // Try to mark the record as error
    try {
      const body2 = await req.clone().json().catch(() => ({}));
      const record_id = body2.record_id || body2.event?.entity_id;
      if (record_id) {
        await base44.asServiceRole.entities.VideoAnalysisResult.update(record_id, { status: 'error' });
      }
    } catch (_) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});