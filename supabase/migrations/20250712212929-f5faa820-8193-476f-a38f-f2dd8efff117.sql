-- Create marketplace_items table
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'GBP',
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  location TEXT NOT NULL,
  image_url TEXT,
  seller_name TEXT NOT NULL,
  seller_contact TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID
);

-- Create marketplace_inquiries table for buyer-seller communication
CREATE TABLE public.marketplace_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  inquirer_name TEXT NOT NULL,
  inquirer_contact TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID
);

-- Enable RLS
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace_items
CREATE POLICY "Anyone can view items" 
ON public.marketplace_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create items" 
ON public.marketplace_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update items" 
ON public.marketplace_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete items" 
ON public.marketplace_items 
FOR DELETE 
USING (true);

-- Create policies for marketplace_inquiries
CREATE POLICY "Anyone can view inquiries" 
ON public.marketplace_inquiries 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create inquiries" 
ON public.marketplace_inquiries 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_marketplace_items_updated_at
BEFORE UPDATE ON public.marketplace_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();