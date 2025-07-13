-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('legal', 'medical', 'financial', 'education')),
  description TEXT,
  location TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  website TEXT,
  languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count INTEGER DEFAULT 0,
  image_url TEXT,
  contact_person TEXT,
  business_hours JSONB,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID
);

-- Create service inquiries table
CREATE TABLE public.service_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  inquirer_name TEXT NOT NULL,
  inquirer_email TEXT NOT NULL,
  inquirer_phone TEXT,
  message TEXT NOT NULL,
  inquiry_type TEXT NOT NULL DEFAULT 'contact' CHECK (inquiry_type IN ('contact', 'request_service')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for services
CREATE POLICY "Anyone can view services" 
ON public.services 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create services" 
ON public.services 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own services" 
ON public.services 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" 
ON public.services 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for service inquiries
CREATE POLICY "Users can view their own inquiries and service owners can view inquiries for their services" 
ON public.service_inquiries 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM public.services WHERE id = service_inquiries.service_id
  )
);

CREATE POLICY "Authenticated users can create inquiries" 
ON public.service_inquiries 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update their own inquiries" 
ON public.service_inquiries 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.services (name, specialty, category, description, location, phone, email, languages, rating, reviews_count, verified, featured) VALUES
('Chen & Associates Legal Services', 'Immigration & Business Law', 'legal', 'Specialist immigration lawyers helping Chinese nationals with visa applications, business setup, and legal compliance.', 'London', '+44 20 7123 4567', 'info@chenlaw.co.uk', ARRAY['English', 'Mandarin', 'Cantonese'], 4.8, 156, true, true),
('UK China Legal Solutions', 'Property & Contract Law', 'legal', 'Expert legal advice for property transactions, rental agreements, and contract negotiations.', 'Manchester', '+44 161 234 5678', 'contact@ukchinalegal.com', ARRAY['English', 'Mandarin'], 4.6, 89, true, false),
('Dr. Wei Liu - Private Practice', 'General Practice & Traditional Medicine', 'medical', 'Combining western medicine with traditional Chinese medicine approaches for comprehensive healthcare.', 'Birmingham', '+44 121 345 6789', 'appointments@drweiliu.co.uk', ARRAY['English', 'Mandarin', 'Cantonese'], 4.9, 203, true, true),
('London Chinese Medical Centre', 'Family Medicine & Pediatrics', 'medical', 'Family-focused medical care with understanding of Chinese cultural health practices and dietary needs.', 'London', '+44 20 8765 4321', 'info@lcmc.co.uk', ARRAY['English', 'Mandarin'], 4.7, 178, true, false),
('Sino-British Financial Advisory', 'Mortgages & Investment Planning', 'financial', 'Specialized in helping Chinese nationals secure mortgages and plan investments in the UK market.', 'London', '+44 20 9876 5432', 'advisors@sbfinancial.co.uk', ARRAY['English', 'Mandarin'], 4.8, 124, true, true),
('Cross-Border Tax Solutions', 'Tax Planning & Compliance', 'financial', 'Expert guidance on UK-China tax implications, offshore accounts, and compliance requirements.', 'Edinburgh', '+44 131 654 3210', 'help@cbtax.co.uk', ARRAY['English', 'Mandarin'], 4.5, 67, true, false),
('Cambridge Chinese Tutorial Centre', 'Academic Support & Tutoring', 'education', 'Supporting Chinese students with academic tutoring, university applications, and study skills development.', 'Cambridge', '+44 1223 456 789', 'tutoring@cctc.edu', ARRAY['English', 'Mandarin'], 4.9, 245, true, true),
('Mandarin Heritage School', 'Chinese Language & Culture', 'education', 'Weekend Chinese school offering Mandarin language classes and cultural education for all ages.', 'Oxford', '+44 1865 987 654', 'info@mandarinheritage.org', ARRAY['English', 'Mandarin', 'Cantonese'], 4.7, 156, true, false);