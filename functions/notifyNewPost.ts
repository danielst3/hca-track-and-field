import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const postData = payload.data;
    if (!postData) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    // Get all users except the post author
    const allUsers = await base44.asServiceRole.entities.User.list();
    const recipients = allUsers.filter(u => u.email !== postData.author_email);

    const title = 'New Post';
    const message = `"${postData.title}" was posted by ${postData.author_email}.`;

    // Create in-app notifications and send emails
    await Promise.all(recipients.map(async (user) => {
      // In-app notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: user.email,
        type: 'new_post',
        title,
        message,
        link_page: 'Posts',
        is_read: false,
      });

      // Email notification
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        subject: `[HCA Chargers] ${title}: ${postData.title}`,
        body: `<p>Hi ${user.full_name},</p><p>A new post has been published: <strong>${postData.title}</strong></p><p>Log in to the app to read it.</p>`,
      });
    }));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});