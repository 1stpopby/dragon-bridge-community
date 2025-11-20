import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

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
    // Skip this check for manual invocations (we'll generate regardless of time)
    const now = new Date()
    const currentHour = now.getUTCHours() + 2 // Romanian time (UTC+2)
    
    console.log(`Current hour: ${currentHour}:00 (active hours: ${config.active_hours[0]}-${config.active_hours[1]})`)
    
    // Note: For manual admin triggers, we proceed regardless of active hours
    // For automated cron jobs, you may want to add a check here

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
      replies_created: 0,
      comments_created: 0
    }

    // Determine how many of each type to create (hourly rate)
    const postsToCreate = Math.ceil(config.posts_per_day / 24)
    const topicsToCreate = Math.ceil(config.forum_topics_per_day / 24)
    const repliesToCreate = Math.ceil(config.replies_per_day / 24)

    // Add feed comments to the mix
    const commentsToCreate = Math.ceil(config.replies_per_day / 24)
    results.comments_created = 0

    // Create feed posts with AI
    for (let i = 0; i < postsToCreate; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)]
      const success = await createFeedPost(supabase, bot)
      if (success) results.posts_created++
      await randomDelay(config.min_delay_minutes, config.max_delay_minutes)
    }

    // Create forum topics with AI
    for (let i = 0; i < topicsToCreate; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)]
      const success = await createForumTopic(supabase, bot)
      if (success) results.forum_topics_created++
      await randomDelay(config.min_delay_minutes, config.max_delay_minutes)
    }

    // Create forum replies with AI
    for (let i = 0; i < repliesToCreate; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)]
      const success = await createForumReply(supabase, bot)
      if (success) results.replies_created++
      await randomDelay(config.min_delay_minutes, config.max_delay_minutes)
    }

    // Create feed comments with AI
    for (let i = 0; i < commentsToCreate; i++) {
      const bot = bots[Math.floor(Math.random() * bots.length)]
      const success = await createFeedComment(supabase, bot)
      if (success) results.comments_created++
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

async function generateAIContent(prompt: string): Promise<string> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Ești un român obișnuit care stă în UK și scrie pe Facebook. Vorbești natural, simplu, ca în viața de zi cu zi. Fără formalism, fără să sune ca un CV sau o compunere. Scrii exact cum ai vorbi cu un prieten - scurt, la obiect, cu umor sau emoție când e cazul.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.9
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API error:', response.status, errorText)
      return ''
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('Error generating AI content:', error)
    return ''
  }
}

async function createFeedPost(supabase: any, bot: any) {
  try {
    // Determine gender from bot metadata
    const isMale = bot.bot_metadata?.persona?.includes('male')
    const genderNote = isMale 
      ? "IMPORTANT: Folosește forme masculine (sunt mulțumit, am fost ocupat, sunt obosit, m-am bucurat)"
      : "IMPORTANT: Folosește forme feminine (sunt mulțumită, am fost ocupată, sunt obosită, m-am bucurat)"
    
    const topics = [
      `Zi cum a fost ziua ta la muncă în ${bot.location}. Ceva simplu, fără prea multe detalii.`,
      `Ai găsit ceva service bun recent în ${bot.location}? Recomandă-l.`,
      `Ce te-a surprins azi pozitiv în UK? Ceva mic, cotidian.`,
      `Plângi-te puțin de ceva din UK sau spune ce îți lipsește din România.`,
      `Weekend-ul ăsta ce faci în ${bot.location}?`,
      `Recomandă un magazin sau un loc din ${bot.location} unde mergi des.`,
      `Zi rapid cum merge cu engleza, adaptarea, sau munca.`,
      `Ce sfat ai pentru cineva nou venit în ${bot.location}?`,
      `Compară ceva din UK cu România - simplu, fără filozofii.`,
      `Ai văzut ceva tare azi în ${bot.location}? Zi-ne.`
    ]
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    const prompt = `Scrie o postare de Facebook foarte scurtă (1-2 propoziții, maxim 25 cuvinte). Tu ești cel care postează, vorbești la persoana I (eu, am, mă, mi-). ${randomTopic} Fii natural și concret. Fără hashtag-uri.

${genderNote}`
    
    const content = await generateAIContent(prompt)
    if (!content) return false
    
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
      template_id: null
    })

    console.log(`AI feed post created by ${bot.display_name}`)
    return true

  } catch (error) {
    console.error('Error in createFeedPost:', error)
    return false
  }
}

async function createForumTopic(supabase: any, bot: any) {
  try {
    // Determine gender from bot metadata
    const isMale = bot.bot_metadata?.persona?.includes('male')
    const genderNote = isMale 
      ? "IMPORTANT: Folosește forme masculine (sunt interesat, sunt ocupat, m-am mutat)"
      : "IMPORTANT: Folosește forme feminine (sunt interesată, sunt ocupată, m-am mutat)"
    
    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('name')
      .eq('type', 'forum')
      .eq('is_active', true)
    
    const categoryList = categories?.map((c: any) => c.name).join(', ') || 'Discuții Generale, Locuri de Muncă, Cazare, Evenimente'

    const prompt = `Scrie o întrebare sau subiect pentru forum. Tu ești cel care întreabă (eu, am, mă). Alege ceva despre: muncă, cazare, transport, servicii, sau viață în ${bot.location}. 

FOARTE IMPORTANT: 
- Titlu: 5-8 cuvinte, natural
- Conținut: 1-2 propoziții, maxim 30 cuvinte, scris simplu
- Vorbește la persoana I (eu caut, am nevoie, mă interesează)
${genderNote}

Alege categorie din: ${categoryList}

JSON format:
{
  "title": "titlul aici",
  "content": "conținutul aici",
  "category": "categoria aici"
}`

    const aiResponse = await generateAIContent(prompt)
    if (!aiResponse) return false

    let parsed
    try {
      parsed = JSON.parse(aiResponse)
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1])
      } else {
        console.error('Failed to parse AI response as JSON')
        return false
      }
    }

    const { error } = await supabase
      .from('forum_posts')
      .insert({
        user_id: bot.user_id,
        author_name: bot.display_name,
        title: parsed.title,
        content: parsed.content,
        category: parsed.category
      })

    if (error) {
      console.error('Error creating forum topic:', error)
      return false
    }

    // Log activity
    await supabase.from('bot_activity_log').insert({
      bot_user_id: bot.id,
      activity_type: 'forum_topic',
      template_id: null
    })

    console.log(`AI forum topic created by ${bot.display_name}: ${parsed.title}`)
    return true

  } catch (error) {
    console.error('Error in createForumTopic:', error)
    return false
  }
}

async function createForumReply(supabase: any, bot: any) {
  try {
    // Determine gender from bot metadata
    const isMale = bot.bot_metadata?.persona?.includes('male')
    const genderNote = isMale 
      ? "IMPORTANT: Folosește forme masculine (am fost mulțumit, sunt interesat, m-am descurcat)"
      : "IMPORTANT: Folosește forme feminine (am fost mulțumită, sunt interesată, m-am descurcat)"
    
    // Get a random recent forum post to reply to
    const { data: forumPosts } = await supabase
      .from('forum_posts')
      .select('id, title, content, author_name')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!forumPosts || forumPosts.length === 0) {
      console.log('No forum posts to reply to')
      return false
    }

    const randomPost = forumPosts[Math.floor(Math.random() * forumPosts.length)]
    
    const prompt = `Cineva a întrebat pe forum:
"${randomPost.title}"
"${randomPost.content}"

Răspunde scurt și natural (1-2 propoziții, maxim 25 cuvinte). Vorbești la persoana I (eu am, mi s-a întâmplat, știu eu). Dă un sfat rapid sau experiența ta.

${genderNote}`

    const content = await generateAIContent(prompt)
    if (!content) return false

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
      template_id: null
    })

    console.log(`AI forum reply created by ${bot.display_name}`)
    return true

  } catch (error) {
    console.error('Error in createForumReply:', error)
    return false
  }
}

async function createFeedComment(supabase: any, bot: any) {
  try {
    // Get a random recent feed post to comment on
    const { data: feedPosts } = await supabase
      .from('posts')
      .select('id, content, author_name')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!feedPosts || feedPosts.length === 0) {
      console.log('No feed posts to comment on')
      return false
    }

    const randomPost = feedPosts[Math.floor(Math.random() * feedPosts.length)]
    
    const prompt = `Cineva a scris pe feed:
"${randomPost.content}"

Scrie un comentariu foarte scurt (1 propoziție, maxim 15 cuvinte). Poate fi: un răspuns rapid, o întrebare, sau "și eu la fel", sau încurajare. Natural, ca pe WhatsApp.`

    const content = await generateAIContent(prompt)
    if (!content) return false

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: randomPost.id,
        user_id: bot.user_id,
        author_name: bot.display_name,
        author_avatar: bot.avatar_url,
        content
      })

    if (error) {
      console.error('Error creating feed comment:', error)
      return false
    }

    // Log activity
    await supabase.from('bot_activity_log').insert({
      bot_user_id: bot.id,
      activity_type: 'feed_comment',
      template_id: null
    })

    console.log(`AI feed comment created by ${bot.display_name}`)
    return true

  } catch (error) {
    console.error('Error in createFeedComment:', error)
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