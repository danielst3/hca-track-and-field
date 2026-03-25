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

    let { video_url, event } = record;
    const eventLabel = event ? event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Track & Field';

    // Convert .mov files to .mp4 by re-uploading with mp4 content type
    // iPhone .mov files use H.264 which is the same codec as .mp4
    if (video_url && video_url.toLowerCase().includes('.mov')) {
      try {
        const videoResponse = await fetch(video_url);
        const videoBuffer = await videoResponse.arrayBuffer();
        const blob = new Blob([videoBuffer], { type: 'video/mp4' });
        const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
        const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        video_url = uploaded.file_url;
      } catch (convErr) {
        // If conversion fails, proceed with original URL
        console.log('MOV conversion failed, using original URL:', convErr.message);
      }
    }

    const prompt = `You are an expert track and field coach. A coach has submitted a ${eventLabel} video for review.
Provide detailed, actionable coaching feedback for a ${eventLabel} athlete. Cover technique fundamentals, common faults to watch for, key body mechanics, and drill recommendations. Be specific, practical, and constructive.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
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