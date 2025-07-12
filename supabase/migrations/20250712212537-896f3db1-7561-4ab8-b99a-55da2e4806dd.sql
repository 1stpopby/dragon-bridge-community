-- Create community_groups table
CREATE TABLE public.community_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organizer_name TEXT NOT NULL,
  user_id UUID
);

-- Create group_memberships table
CREATE TABLE public.group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID,
  member_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_name)
);

-- Enable RLS
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- Create policies for community_groups
CREATE POLICY "Anyone can view groups" 
ON public.community_groups 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create groups" 
ON public.community_groups 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update groups" 
ON public.community_groups 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete groups" 
ON public.community_groups 
FOR DELETE 
USING (true);

-- Create policies for group_memberships
CREATE POLICY "Anyone can view memberships" 
ON public.group_memberships 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create memberships" 
ON public.group_memberships 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete memberships" 
ON public.group_memberships 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_community_groups_updated_at
BEFORE UPDATE ON public.community_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_groups 
    SET member_count = member_count + 1 
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_groups 
    SET member_count = member_count - 1 
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update member count
CREATE TRIGGER update_member_count_trigger
AFTER INSERT OR DELETE ON public.group_memberships
FOR EACH ROW
EXECUTE FUNCTION update_group_member_count();