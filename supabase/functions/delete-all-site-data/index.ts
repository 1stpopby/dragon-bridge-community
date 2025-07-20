import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Set the auth context for the request
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (adminError || !adminCheck) {
      throw new Error('Unauthorized: Admin access required')
    }

    console.log(`Admin ${user.email} initiated site data deletion`)

    // Tables to clear (in specific order to handle foreign key constraints)
    const tablesToClear = [
      // Related data first
      'post_likes',
      'post_comments',
      'forum_post_reactions',
      'forum_replies',
      'group_discussion_reactions',
      'group_discussion_replies',
      'group_discussions',
      'group_memberships',
      'event_registrations',
      'marketplace_inquiries',
      'service_feedback',
      'service_request_responses',
      'service_request_messages',
      'service_inquiries',
      'company_services',
      'services',
      'company_gallery',
      'company_reviews',
      'notifications',
      
      // Main content tables
      'posts',
      'forum_posts',
      'events',
      'community_groups',
      'marketplace_items',
      'saved_posts',
      
      // Keep announcements and advertisements as they might be admin-created
      // 'announcements',
      // 'advertisements',
      
      // Keep app settings, categories, and footer pages
      // 'app_settings',
      // 'categories',
      // 'footer_pages',
    ]

    const deletionResults = []

    // Delete data from each table
    for (const table of tablesToClear) {
      try {
        console.log(`Deleting data from ${table}...`)
        
        const { error } = await supabaseClient
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        
        if (error) {
          console.error(`Error deleting from ${table}:`, error)
          deletionResults.push({ table, status: 'error', error: error.message })
        } else {
          console.log(`Successfully cleared ${table}`)
          deletionResults.push({ table, status: 'success' })
        }
      } catch (err) {
        console.error(`Exception deleting from ${table}:`, err)
        deletionResults.push({ table, status: 'error', error: err.message })
      }
    }

    // Reset auto-increment sequences if needed (PostgreSQL specific)
    const sequenceResets = [
      // Add any sequences that need resetting
    ]

    for (const sequence of sequenceResets) {
      try {
        await supabaseClient.rpc('reset_sequence', { sequence_name: sequence })
      } catch (err) {
        console.log(`Note: Could not reset sequence ${sequence}:`, err.message)
      }
    }

    console.log('Site data deletion completed')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All site data has been successfully deleted',
        results: deletionResults,
        deletedTables: tablesToClear
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in delete-all-site-data function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
