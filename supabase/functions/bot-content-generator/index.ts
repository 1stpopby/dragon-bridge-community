import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Romanian names for bot profiles
const romanianFirstNames = {
  male: ['Andrei', 'Alexandru', 'Mihai', 'Ion', 'Vasile', 'Constantin', 'Gabriel', 'Florin', 'Cristian', 'Dan', 'Adrian', 'Marius', 'Ionuț', 'George', 'Bogdan'],
  female: ['Maria', 'Elena', 'Ana', 'Ioana', 'Andreea', 'Cristina', 'Mihaela', 'Daniela', 'Gabriela', 'Alina', 'Alexandra', 'Carmen', 'Simona', 'Roxana', 'Laura']
}

const romanianLastNames = ['Popescu', 'Ionescu', 'Popa', 'Constantin', 'Dumitrescu', 'Stan', 'Gheorghe', 'Marin', 'Tudor', 'Matei', 'Stoica', 'Radu', 'Nistor', 'Florea', 'Dima']

const ukCities = ['Londra', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Edinburgh', 'Nottingham', 'Leicester', 'Newcastle', 'Southampton', 'Portsmouth', 'Reading']

interface BotConfig {
  bot_count: number
  posts_per_day: number
  forum_topics_per_day: number
  replies_per_day: number
  active_hours: [number, number]
  content_variety: {
    text_only: number
    with_hashtags: number
    with_mentions: number
  }
  min_delay_minutes: number
  max_delay_minutes: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Bot Content Generator: Starting...')

    // Check if bot system is enabled
    const { data: systemEnabled } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'bot_system_enabled')
      .single()

    if (!systemEnabled?.setting_value) {
      console.log('Bot system is disabled')
      return new Response(
        JSON.stringify({ message: 'Bot system is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get bot configuration
    const { data: configData } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'bot_config')
      .single()

    const config: BotConfig = configData?.setting_value as BotConfig || {
      bot_count: 20,
      posts_per_day: 12,
      forum_topics_per_day: 4,
      replies_per_day: 10,
      active_hours: [8, 22],
      content_variety: { text_only: 60, with_hashtags: 30, with_mentions: 10 },
      min_delay_minutes: 5,
      max_delay_minutes: 30
    }

    // Check if we're within active hours (Romanian time)
    const now = new Date()
    const currentHour = now.getUTCHours() + 2 // Romanian time (UTC+2)
    
    if (currentHour < config.active_hours[0] || currentHour > config.active_hours[1]) {
      console.log(`Outside active hours: ${currentHour}:00 (active: ${config.active_hours[0]}-${config.active_hours[1]})`)
      return new Response(
        JSON.stringify({ message: 'Outside active hours' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get or create bot users
    const { data: botProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_bot', true)
      .limit(config.bot_count)

    let bots = botProfiles || []

    // Create more bots if needed
    if (bots.length < config.bot_count) {
      const botsToCreate = config.bot_count - bots.length
      console.log(`Creating ${botsToCreate} new bot profiles...`)
      
      for (let i = 0; i < botsToCreate; i++) {
        const bot = await createBotUser(supabase)
        if (bot) bots.push(bot)
      }
    }

    console.log(`Active bots: ${bots.length}`)

    // Get active content templates
    const { data: templates } = await supabase
      .from('bot_content_templates')
      .select('*')
      .eq('is_active', true)

    if (!templates || templates.length === 0) {
      console.log('No active content templates found')
      return new Response(
        JSON.stringify({ message: 'No active content templates' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const results = {
      posts_created: 0,
      forum_topics_created: 0,
      replies_created: 0
    }

    // Determine how many of each type to create (hourly rate)
    const postsToCreate = Math.ceil(config.posts_per_day / 24)
    const topicsToCreate = Math.ceil(config.forum_topics_per_day / 24)
    const repliesToCreate = Math.ceil(config.replies_per_day / 24)

    // Create feed posts
    const postTemplates = templates.filter(t => t.content_type === 'post')
    for (let i = 0; i < postsToCreate && i < postTemplates.length; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)]
      const template = postTemplates[Math.floor(Math.random() * postTemplates.length)]
      
      const success = await createFeedPost(supabase, bot, template)
      if (success) results.posts_created++
      
      await randomDelay(config.min_delay_minutes, config.max_delay_minutes)
    }

    // Create forum topics
    const topicTemplates = templates.filter(t => t.content_type === 'forum_topic')
    for (let i = 0; i < topicsToCreate && i < topicTemplates.length; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)]
      const template = topicTemplates[Math.floor(Math.random() * topicTemplates.length)]
      
      const success = await createForumTopic(supabase, bot, template)
      if (success) results.forum_topics_created++
      
      await randomDelay(config.min_delay_minutes, config.max_delay_minutes)
    }

    // Create forum replies
    const replyTemplates = templates.filter(t => t.content_type === 'forum_reply')
    for (let i = 0; i < repliesToCreate && i < replyTemplates.length; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)]
      const template = replyTemplates[Math.floor(Math.random() * replyTemplates.length)]
      
      const success = await createForumReply(supabase, bot, template)
      if (success) results.replies_created++
      
      await randomDelay(config.min_delay_minutes, config.max_delay_minutes)
    }

    console.log('Bot generation completed:', results)

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error in bot-content-generator:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function createBotUser(supabase: any) {
  try {
    const gender = Math.random() > 0.5 ? 'male' : 'female'
    const firstName = romanianFirstNames[gender][Math.floor(Math.random() * romanianFirstNames[gender].length)]
    const lastName = romanianLastNames[Math.floor(Math.random() * romanianLastNames.length)]
    const displayName = `${firstName} ${lastName}`
    const city = ukCities[Math.floor(Math.random() * ukCities.length)]

    // Create auth user
    const email = `bot_${Date.now()}_${Math.random().toString(36).substring(7)}@roeu.internal`
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      email_confirm: true,
      user_metadata: {
        account_type: 'user',
        display_name: displayName
      }
    })

    if (authError) {
      console.error('Error creating bot auth user:', authError)
      return null
    }

    // Update profile to mark as bot
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        is_bot: true,
        display_name: displayName,
        location: city,
        bio: `Român în ${city} 🇷🇴`,
        bot_metadata: {
          persona: gender === 'male' ? 'male_professional' : 'female_professional',
          created_at: new Date().toISOString()
        }
      })
      .eq('user_id', authData.user.id)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating bot profile:', profileError)
      return null
    }

    console.log(`Created bot: ${displayName}`)
    return profile

  } catch (error) {
    console.error('Error in createBotUser:', error)
    return null
  }
}

async function createFeedPost(supabase: any, bot: any, template: any) {
  try {
    const content = fillTemplate(template.template_text, bot)
    
    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: bot.user_id,
        author_name: bot.display_name,
        author_avatar: bot.avatar_url,
        content
      })

    if (error) {
      console.error('Error creating feed post:', error)
      return false
    }

    // Log activity
    await supabase.from('bot_activity_log').insert({
      bot_user_id: bot.id,
      activity_type: 'post_created',
      template_id: template.id
    })

    // Increment template usage
    await supabase
      .from('bot_content_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', template.id)

    console.log(`Feed post created by ${bot.display_name}`)
    return true

  } catch (error) {
    console.error('Error in createFeedPost:', error)
    return false
  }
}

async function createForumTopic(supabase: any, bot: any, template: any) {
  try {
    const [title, ...contentParts] = template.template_text.split('|')
    const content = fillTemplate(contentParts.join('|') || title, bot)
    const filledTitle = fillTemplate(title, bot)

    const { error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: bot.user_id,
        author_name: bot.display_name,
        title: filledTitle,
        content,
        category: template.category || 'Discuții Generale'
      })

    if (error) {
      console.error('Error creating forum topic:', error)
      return false
    }

    // Log activity
    await supabase.from('bot_activity_log').insert({
      bot_user_id: bot.id,
      activity_type: 'forum_topic',
      template_id: template.id
    })

    // Increment template usage
    await supabase
      .from('bot_content_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', template.id)

    console.log(`Forum topic created by ${bot.display_name}: ${filledTitle}`)
    return true

  } catch (error) {
    console.error('Error in createForumTopic:', error)
    return false
  }
}

async function createForumReply(supabase: any, bot: any, template: any) {
  try {
    // Get a random recent forum post to reply to
    const { data: forumPosts } = await supabase
      .from('forum_posts')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!forumPosts || forumPosts.length === 0) {
      console.log('No forum posts to reply to')
      return false
    }

    const randomPost = forumPosts[Math.floor(Math.random() * forumPosts.length)]
    const content = fillTemplate(template.template_text, bot)

    const { error } = await supabase
      .from('forum_replies')
      .insert({
        post_id: randomPost.id,
        user_id: bot.user_id,
        author_name: bot.display_name,
        content
      })

    if (error) {
      console.error('Error creating forum reply:', error)
      return false
    }

    // Log activity
    await supabase.from('bot_activity_log').insert({
      bot_user_id: bot.id,
      activity_type: 'forum_reply',
      template_id: template.id
    })

    // Increment template usage
    await supabase
      .from('bot_content_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', template.id)

    console.log(`Forum reply created by ${bot.display_name}`)
    return true

  } catch (error) {
    console.error('Error in createForumReply:', error)
    return false
  }
}

function fillTemplate(template: string, bot: any): string {
  const cities = ukCities
  const topics = ['locuri de muncă', 'cazare', 'școli', 'transport', 'servicii medicale', 'comunitate', 'evenimente']
  const activities = ['mers la cumpărături', 'ieșit în parc', 'vizitat muzee', 'întâlniri cu prietenii', 'sport']
  const services = ['electrician', 'instalator', 'dentist', 'medic', 'mecanic auto']
  const products = ['ingrediente românești', 'electronice', 'mobilă', 'haine', 'jucării pentru copii']

  return template
    .replace(/\[city\]/g, bot.location || cities[Math.floor(Math.random() * cities.length)])
    .replace(/\[topic\]/g, topics[Math.floor(Math.random() * topics.length)])
    .replace(/\[activity\]/g, activities[Math.floor(Math.random() * activities.length)])
    .replace(/\[service\]/g, services[Math.floor(Math.random() * services.length)])
    .replace(/\[product\/service\]/g, Math.random() > 0.5 ? products[Math.floor(Math.random() * products.length)] : services[Math.floor(Math.random() * services.length)])
    .replace(/\[product\]/g, products[Math.floor(Math.random() * products.length)])
    .replace(/\[name\]/g, bot.display_name)
}

function randomDelay(minMinutes: number, maxMinutes: number): Promise<void> {
  const delayMs = (minMinutes + Math.random() * (maxMinutes - minMinutes)) * 60 * 1000
  return new Promise(resolve => setTimeout(resolve, delayMs))
}