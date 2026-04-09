import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Allow athletes to fetch their own data, or coaches/admins to fetch any athlete's data
  const body = await req.json().catch(() => ({}));
  const athleteEmail = (body.athlete_email || user.email).toLowerCase();

  // Only non-admins/coaches can only fetch their own data
  if (user.role === 'user' && athleteEmail !== user.email.toLowerCase()) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service role to bypass RLS
  const [throwLogs, trainingLogs] = await Promise.all([
    base44.asServiceRole.entities.ThrowLog.list(),
    base44.asServiceRole.entities.TrainingLog.list(),
  ]);

  // Filter case-insensitively
  const filtered_throw = throwLogs.filter(l => l.athlete_email?.toLowerCase() === athleteEmail);
  const filtered_training = trainingLogs.filter(l => l.athlete_email?.toLowerCase() === athleteEmail);

  return Response.json({ throwLogs: filtered_throw, trainingLogs: filtered_training });
});