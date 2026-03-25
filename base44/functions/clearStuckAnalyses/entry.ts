import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'coach')) {
      return Response.json({ error: 'Forbidden: Coach or Admin access required' }, { status: 403 });
    }

    const stuckAnalyses = await base44.asServiceRole.entities.VideoAnalysisResult.filter({
      status: { $in: ['processing', 'error'] }
    });

    if (stuckAnalyses.length === 0) {
      return Response.json({ cleared: 0, message: 'No stuck analyses found.' });
    }

    await Promise.all(stuckAnalyses.map(a =>
      base44.asServiceRole.entities.VideoAnalysisResult.delete(a.id)
    ));

    return Response.json({ cleared: stuckAnalyses.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});