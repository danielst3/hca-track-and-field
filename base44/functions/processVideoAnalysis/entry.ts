import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let record_id = null;

  try {
    const body = await req.json();
    record_id = body.record_id || body.event?.entity_id;

    if (!record_id) {
      return Response.json({ error: 'record_id is required' }, { status: 400 });
    }

    const record = await base44.asServiceRole.entities.VideoAnalysisResult.get(record_id);
    if (!record) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    if (record.status !== 'processing') {
      return Response.json({ skipped: true, reason: 'Not in processing state' });
    }

    const { event } = record;
    const eventLabel = event ? event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Track & Field';

    const prompt = `You are an expert track and field coach reviewing a ${eventLabel} video submission.
Provide detailed, actionable coaching feedback for a ${eventLabel} athlete. Cover technique fundamentals, common faults, key body mechanics, and drill recommendations. Be specific, practical, and constructive.

Return your analysis in the requested JSON format.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
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
    console.error('processVideoAnalysis error:', error.message);
    if (record_id) {
      try {
        await base44.asServiceRole.entities.VideoAnalysisResult.update(record_id, { status: 'error' });
      } catch (_) {}
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});