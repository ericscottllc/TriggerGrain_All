import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UserWithRole {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || userRole?.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'list') {
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('user_id, role, created_at')
        .order('created_at', { ascending: false });

      const { data: { users: authUsers } } = await supabaseClient.auth.admin.listUsers();

      const usersWithRoles: UserWithRole[] = authUsers.map(u => {
        const role = roles?.find(r => r.user_id === u.id);
        return {
          id: u.id,
          email: u.email || '',
          role: role?.role || 'PENDING',
          created_at: role?.created_at || u.created_at,
        };
      });

      return new Response(
        JSON.stringify({ users: usersWithRoles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      const { userId, newRole } = await req.json();

      if (userId === user.id) {
        throw new Error('Cannot modify your own role');
      }

      if (!['ADMIN', 'PENDING'].includes(newRole)) {
        throw new Error('Invalid role');
      }

      const { error: updateError } = await supabaseClient
        .from('user_roles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      const { userId } = await req.json();

      if (userId === user.id) {
        throw new Error('Cannot delete your own account');
      }

      const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status =
      errorMessage === 'Unauthorized' || errorMessage === 'Admin access required' ? 403 :
      errorMessage === 'Invalid action' || errorMessage === 'Invalid role' ? 400 :
      500;

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
