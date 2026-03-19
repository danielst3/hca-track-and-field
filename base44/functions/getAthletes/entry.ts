import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a coach or admin (actual role OR preference role)
    const savedRole = user.role; // role after sdk resolves
    const prefRoles = user.user_role_preference ? user.user_role_preference.split(",") : [];
    const allRoles = [savedRole, ...prefRoles];
    const isCoachOrAdmin = allRoles.includes("admin") || allRoles.includes("coach");

    if (!isCoachOrAdmin) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use service role to list all users
    const allUsers = await base44.asServiceRole.entities.User.list();
    return Response.json({ users: allUsers });
});