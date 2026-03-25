import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin' && user.role !== 'coach') {
      return Response.json({ error: 'Forbidden: Coach or admin access required' }, { status: 403 });
    }

    const { log_id, log_type, video_url, event, athlete_email } = await req.json();

    if (!video_url || !event || !athlete_email) {
      return Response.json({ error: 'Missing required fields: video_url, event, athlete_email' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const record = await base44.asServiceRole.entities.VideoAnalysisResult.create({
      athlete_email,
      event,
      video_url,
      ai_response: '',
      coach_feedback: '',
      status: 'processing',
      analysis_date: today,
    });

    return Response.json({ success: true, analysis: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});