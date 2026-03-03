import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json();

    if (!data.email || !data.full_name || !data.role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role to create the request (user is not logged in)
    const request = await base44.asServiceRole.entities.AccessRequest.create({
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      athlete_name: data.athlete_name || '',
      notes: data.notes || '',
      status: 'pending',
    });

    // Notify admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const roleLabel = data.role === 'user' ? 'Athlete' : data.role === 'coach' ? 'Coach' : 'Parent';
    const athleteInfo = data.athlete_name ? `\nAthlete: ${data.athlete_name}` : '';
    const notesInfo = data.notes ? `\n\nNotes: ${data.notes}` : '';

    await Promise.allSettled(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `New Access Request - ${data.full_name}`,
        body: `A new access request has been submitted:\n\nName: ${data.full_name}\nEmail: ${data.email}\nRequesting: ${roleLabel}${athleteInfo}${notesInfo}\n\nPlease review in the Access Requests page.`
      })
    ));

    return Response.json({ success: true, id: request.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});