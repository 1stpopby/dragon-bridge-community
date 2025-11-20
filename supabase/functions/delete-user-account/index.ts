import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the current user (admin making the request)
    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser(
      authorization.replace('Bearer ', '')
    )

    if (authError || !adminUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if the requesting user is an admin
    const { data: isAdmin } = await supabaseClient.rpc('is_admin_user', { 
      check_user_id: adminUser.id 
    })

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get userId from request body (for admin deletions)
    const { userId } = await req.json()
    const targetUserId = userId || adminUser.id

    // Enhanced audit logging
    console.log(`[AUDIT] User deletion initiated`, {
      admin_id: adminUser.id,
      admin_email: adminUser.email,
      target_user_id: targetUserId,
      timestamp: new Date().toISOString(),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    })

    // Start deletion process
    // Delete user data from public schema tables (in order due to foreign key constraints)
    
    // Delete notifications
    await supabaseClient.from('notifications').delete().eq('user_id', targetUserId)
    console.log('Deleted notifications')

    // Delete messages (both sent and received)
    await supabaseClient.from('messages').delete().eq('sender_id', targetUserId)
    await supabaseClient.from('messages').delete().eq('recipient_id', targetUserId)
    console.log('Deleted messages')

    // Delete user's forum activity
    await supabaseClient.from('forum_post_reactions').delete().eq('user_id', targetUserId)
    await supabaseClient.from('forum_replies').delete().eq('user_id', targetUserId)
    await supabaseClient.from('forum_posts').delete().eq('user_id', targetUserId)
    console.log('Deleted forum activity')

    // Delete user's social activity
    await supabaseClient.from('post_likes').delete().eq('user_id', targetUserId)
    await supabaseClient.from('post_comments').delete().eq('user_id', targetUserId)
    await supabaseClient.from('posts').delete().eq('user_id', targetUserId)
    await supabaseClient.from('saved_posts').delete().eq('user_id', targetUserId)
    console.log('Deleted social activity')

    // Delete group activity
    await supabaseClient.from('group_discussion_reactions').delete().eq('user_id', targetUserId)
    await supabaseClient.from('group_discussion_replies').delete().eq('user_id', targetUserId)
    await supabaseClient.from('group_discussions').delete().eq('user_id', targetUserId)
    await supabaseClient.from('group_memberships').delete().eq('user_id', targetUserId)
    await supabaseClient.from('community_groups').delete().eq('user_id', targetUserId)
    console.log('Deleted group activity')

    // Delete event activity
    await supabaseClient.from('event_registrations').delete().eq('user_id', targetUserId)
    await supabaseClient.from('events').delete().eq('user_id', targetUserId)
    console.log('Deleted event activity')

    // Delete marketplace activity
    await supabaseClient.from('marketplace_inquiries').delete().eq('user_id', targetUserId)
    await supabaseClient.from('marketplace_items').delete().eq('user_id', targetUserId)
    console.log('Deleted marketplace activity')

    // Get profile first to check if it's a company account
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id, account_type')
      .eq('user_id', targetUserId)
      .single()

    if (profile && profile.account_type === 'company') {
      // Delete company-specific data
      await supabaseClient.from('service_feedback').delete().eq('company_id', profile.id)
      await supabaseClient.from('company_feedback').delete().eq('company_id', profile.id)
      await supabaseClient.from('service_request_responses').delete().eq('company_id', profile.id)
      await supabaseClient.from('company_gallery').delete().eq('company_id', profile.id)
      await supabaseClient.from('company_services').delete().eq('company_id', profile.id)
      await supabaseClient.from('company_reviews').delete().eq('company_id', profile.id)
      await supabaseClient.from('company_verification_requests').delete().eq('company_id', profile.id)
      console.log('Deleted company-specific data')
    }

    // Delete service requests created by user
    await supabaseClient.from('service_inquiries').delete().eq('user_id', targetUserId)
    console.log('Deleted service inquiries')

    // Delete user roles
    await supabaseClient.from('user_roles').delete().eq('user_id', targetUserId)
    console.log('Deleted user roles')

    // Delete user bans
    await supabaseClient.from('user_bans').delete().eq('user_id', targetUserId)
    console.log('Deleted user bans')

    // Delete profile
    await supabaseClient.from('profiles').delete().eq('user_id', targetUserId)
    console.log('Deleted profile')

    // Finally, delete the auth user (this will cascade to any remaining references)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(targetUserId)
    
    if (deleteError) {
      console.error('[AUDIT] User deletion failed', {
        admin_id: adminUser.id,
        target_user_id: targetUserId,
        error: deleteError.message,
        timestamp: new Date().toISOString()
      })
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`[AUDIT] User deletion completed successfully`, {
      admin_id: adminUser.id,
      admin_email: adminUser.email,
      deleted_user_id: targetUserId,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})