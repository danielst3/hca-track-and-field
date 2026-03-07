import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    const eventLabel = event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const prompt = `You are an expert track and field coach specializing in ${eventLabel}. 
Analyze the athlete's technique in this video and provide detailed, actionable coaching feedback.

Focus on:
1. Body positioning and mechanics
2. Key technical points specific to ${eventLabel}
3. Strengths observed in this performance
4. Areas for improvement with specific corrections
5. Prioritized drill recommendations to address the main issues

Be specific, encouraging, and practical. Format your response clearly with sections for Strengths, Areas for Improvement, and Recommended Drills.`;

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [video_url],
    });

    const today = new Date().toISOString().split('T')[0];
    const analysisRecord = await base44.asServiceRole.entities.VideoAnalysisResult.create({
      athlete_email,
      event,
      video_url,
      ai_response: typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult),
      analysis_date: today,
    });

    return Response.json({ success: true, analysis: analysisRecord });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});