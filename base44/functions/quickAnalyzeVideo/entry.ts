import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try {
      user = await base44.auth.me();
    } catch (_) {}

    if (!user || (user.role !== 'admin' && user.role !== 'coach')) {
      return Response.json({ error: 'Forbidden: Coach or Admin access required' }, { status: 403 });
    }

    const { video_url, event } = await req.json();

    if (!video_url) {
      return Response.json({ error: 'video_url is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const record = await base44.asServiceRole.entities.VideoAnalysisResult.create({
      event: event || 'shot_put',
      video_url,
      ai_response: '',
      coach_feedback: '',
      status: 'processing',
      analysis_date: today,
    });

    return Response.json({ record_id: record.id, status: 'processing' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});