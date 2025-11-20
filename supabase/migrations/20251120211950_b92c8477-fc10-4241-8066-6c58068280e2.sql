-- Phase 1: Bot System Foundation - Database Schema (Fixed)

-- Add bot-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_metadata jsonb DEFAULT '{}'::jsonb;

-- Create bot_content_templates table
CREATE TABLE IF NOT EXISTS public.bot_content_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('post', 'forum_topic', 'forum_reply')),
  template_text text NOT NULL,
  category text,
  tags text[],
  language text DEFAULT 'ro',
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create bot_activity_log table
CREATE TABLE IF NOT EXISTS public.bot_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('post_created', 'forum_topic', 'forum_reply', 'comment_created')),
  content_id uuid,
  template_id uuid REFERENCES public.bot_content_templates(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.bot_content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bot_content_templates
CREATE POLICY "Admins can manage all bot content templates"
  ON public.bot_content_templates
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Admins can view all templates"
  ON public.bot_content_templates
  FOR SELECT
  USING (is_admin_user(auth.uid()));

-- RLS Policies for bot_activity_log
CREATE POLICY "Admins can view all bot activity logs"
  ON public.bot_activity_log
  FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage bot activity logs"
  ON public.bot_activity_log
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Create trigger to update updated_at on bot_content_templates
CREATE TRIGGER update_bot_content_templates_updated_at
  BEFORE UPDATE ON public.bot_content_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_bot ON public.profiles(is_bot) WHERE is_bot = true;
CREATE INDEX IF NOT EXISTS idx_bot_templates_type ON public.bot_content_templates(content_type);
CREATE INDEX IF NOT EXISTS idx_bot_templates_active ON public.bot_content_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bot_activity_bot_user ON public.bot_activity_log(bot_user_id);
CREATE INDEX IF NOT EXISTS idx_bot_activity_created ON public.bot_activity_log(created_at DESC);

-- Insert initial bot system configuration into app_settings (using 'text' type with JSON string)
INSERT INTO public.app_settings (setting_key, setting_type, setting_value, description, is_public)
VALUES 
  ('bot_system_enabled', 'boolean', 'true'::jsonb, 'Enable/disable the entire bot system', false),
  ('bot_config', 'text', '{"bot_count": 20, "posts_per_day": 12, "forum_topics_per_day": 4, "replies_per_day": 10, "active_hours": [8, 22], "content_variety": {"text_only": 60, "with_hashtags": 30, "with_mentions": 10}, "min_delay_minutes": 5, "max_delay_minutes": 30}'::jsonb, 'Bot system configuration settings', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_bot IS 'Identifies bot accounts created for platform activity generation';
COMMENT ON COLUMN public.profiles.bot_metadata IS 'Stores bot configuration like persona type, posting preferences, etc.';
COMMENT ON TABLE public.bot_content_templates IS 'Templates for bot-generated content (posts, forum topics, replies)';
COMMENT ON TABLE public.bot_activity_log IS 'Log of all bot activities for monitoring and analytics';