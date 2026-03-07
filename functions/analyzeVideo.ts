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
A coach has submitted an athlete video for review (video URL: ${video_url}).
Since the video cannot be directly analyzed, provide detailed expert coaching feedback for the ${eventLabel} event based on common technique issues, best practices, and training recommendations.
Be concise and practical. Provide a brief overall summary, list key strengths to look for and encourage, list specific areas for improvement with corrections, list prioritized drill recommendations, and give short feedback on body positioning and event-specific mechanics.`;

    const responseJsonSchema = {
      type: "object",
      properties: {
        summary: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        areas_for_improvement: { type: "array", items: { type: "string" } },
        drill_recommendations: { type: "array", items: { type: "string" } },
        technical_feedback: {
          type: "object",
          properties: {
            body_positioning: { type: "string" },
            event_specific_mechanics: { type: "string" }
          }
        }
      },
      required: ["summary", "strengths", "areas_for_improvement", "drill_recommendations", "technical_feedback"]
    };

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: responseJsonSchema,
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