import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let record_id = null;

  try {
    const body = await req.json();
    console.log('processVideoAnalysis payload:', JSON.stringify(body));
    record_id = body.record_id || body.event?.entity_id || body.data?.id;
    console.log('resolved record_id:', record_id);

    if (!record_id) {
      console.error('No record_id found in payload:', JSON.stringify(body));
      return Response.json({ error: 'record_id is required' }, { status: 400 });
    }

    console.log('fetching record:', record_id);
    const record = await base44.asServiceRole.entities.VideoAnalysisResult.get(record_id);
    console.log('fetched record:', JSON.stringify(record));

    if (!record) {
      console.error('Record not found for id:', record_id);
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }

    console.log('record status:', record.status, 'video_url:', record.video_url);
    if (record.status !== 'processing') {
      console.log('skipping - status is:', record.status);
      return Response.json({ skipped: true, reason: 'Not in processing state' });
    }

    const { event, frame_urls } = record;
    const eventLabel = event ? event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Track & Field';
    // Filter out video files — only pass image frames to the AI
    const imageFrameUrls = (frame_urls || []).filter(url => !url.match(/\.(mp4|mov|avi|webm|mkv|m4v)(\?.*)?$/i));
    const hasFrames = imageFrameUrls.length > 0;

    const prompt = hasFrames
      ? `You are an expert track and field coach analyzing video frames of a ${eventLabel} athlete. You are provided with ${frame_urls.length} keyframes extracted from the video. Analyze the athlete's technique visible in these frames and provide detailed, actionable coaching feedback covering: technical strengths you can observe, areas for improvement with specific corrections based on what you see, body mechanics and positioning, and drill recommendations tailored to ${eventLabel}. Be specific about what you observe in the images.`
      : `You are an expert track and field coach providing coaching feedback for a ${eventLabel} athlete. Provide detailed, actionable coaching feedback covering: common technical points to focus on for this event, key strengths to build on, the most important areas for improvement with specific corrections, key body mechanics, and drill recommendations tailored to ${eventLabel}. Be specific and practical.`;

    let result;
    try {
      result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        ...(hasFrames ? { file_urls: imageFrameUrls.slice(0, 4), model: 'gemini_3_flash' } : {}),
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
    } catch (aiError) {
      const aiErrorMsg = aiError?.message || String(aiError);
      console.error('AI InvokeLLM failed for record', record_id, ':', aiErrorMsg);
      console.error('AI error details:', JSON.stringify(aiError, Object.getOwnPropertyNames(aiError)));
      console.error('hasFrames:', hasFrames, 'imageFrameUrls count:', imageFrameUrls?.length ?? 0, 'raw frame_urls count:', frame_urls?.length ?? 0);
      await base44.asServiceRole.entities.VideoAnalysisResult.update(record_id, {
        status: 'error',
        ai_response: JSON.stringify({ error: aiErrorMsg, hasFrames, frameCount: frame_urls?.length ?? 0 }),
      });
      return Response.json({ error: 'AI analysis failed', detail: aiErrorMsg }, { status: 500 });
    }

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