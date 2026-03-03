import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const requestData = payload.data;
    if (!requestData) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    // Get all admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const admins = allUsers.filter(u => u.role === 'admin');

    const title = 'New Access Request';
    const message = `${requestData.full_name} (${requestData.email}) has requested access as ${requestData.role}.`;

    // Create in-app notifications and send emails for each admin
    await Promise.all(admins.map(async (admin) => {
      // In-app notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: admin.email,
        type: 'access_request',
        title,
        message,
        link_page: 'AccessRequests',
        is_read: false,
      });

      // Email notification
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `[HCA Chargers] ${title}`,
        body: `<p>Hi ${admin.full_name},</p><p>${message}</p><p>Log in to review and approve or deny the request.</p>`,
      });
    }));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});