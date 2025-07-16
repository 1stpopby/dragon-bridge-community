-- Create footer_pages table for managing static pages like contact, privacy, terms
CREATE TABLE IF NOT EXISTS public.footer_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.footer_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for footer_pages
CREATE POLICY "Anyone can view published footer pages" 
ON public.footer_pages 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admin users can manage footer pages" 
ON public.footer_pages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Insert default footer pages
INSERT INTO public.footer_pages (slug, title, content, meta_description, is_published) VALUES
(
  'contact',
  'Contact Us',
  '<div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Contact Us</h1>
    <p class="text-lg mb-8">Get in touch with the UK Chinese Community team. We''re here to help!</p>
    
    <div class="grid md:grid-cols-2 gap-8">
      <div>
        <h2 class="text-xl font-semibold mb-4">Get in Touch</h2>
        <div class="space-y-3">
          <p><strong>Email:</strong> info@ukchinesecommunity.com</p>
          <p><strong>Phone:</strong> +44 20 1234 5678</p>
          <p><strong>Address:</strong> 123 Community Street, London, UK</p>
        </div>
      </div>
      
      <div>
        <h2 class="text-xl font-semibold mb-4">Office Hours</h2>
        <div class="space-y-2">
          <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM</p>
          <p><strong>Saturday:</strong> 10:00 AM - 4:00 PM</p>
          <p><strong>Sunday:</strong> Closed</p>
        </div>
      </div>
    </div>
  </div>',
  'Contact the UK Chinese Community team - get in touch with us for support, inquiries, or to learn more about our services.',
  true
),
(
  'privacy',
  'Privacy Policy',
  '<div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Privacy Policy</h1>
    <p class="text-sm text-gray-600 mb-8">Last updated: January 2025</p>
    
    <div class="space-y-6">
      <section>
        <h2 class="text-xl font-semibold mb-3">Information We Collect</h2>
        <p class="mb-3">We collect information you provide directly to us, such as when you:</p>
        <ul class="list-disc list-inside space-y-1 ml-4">
          <li>Create an account</li>
          <li>Participate in community forums</li>
          <li>Contact us for support</li>
          <li>Subscribe to our newsletter</li>
        </ul>
      </section>
      
      <section>
        <h2 class="text-xl font-semibold mb-3">How We Use Your Information</h2>
        <p class="mb-3">We use your information to:</p>
        <ul class="list-disc list-inside space-y-1 ml-4">
          <li>Provide and improve our services</li>
          <li>Communicate with you about updates and events</li>
          <li>Ensure the security of our platform</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>
      
      <section>
        <h2 class="text-xl font-semibold mb-3">Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
      </section>
      
      <section>
        <h2 class="text-xl font-semibold mb-3">Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at privacy@ukchinesecommunity.com</p>
      </section>
    </div>
  </div>',
  'Privacy Policy for UK Chinese Community - learn how we collect, use, and protect your personal information.',
  true
),
(
  'terms',
  'Terms of Service',
  '<div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Terms of Service</h1>
    <p class="text-sm text-gray-600 mb-8">Last updated: January 2025</p>
    
    <div class="space-y-6">
      <section>
        <h2 class="text-xl font-semibold mb-3">Acceptance of Terms</h2>
        <p>By accessing and using the UK Chinese Community platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
      </section>
      
      <section>
        <h2 class="text-xl font-semibold mb-3">User Responsibilities</h2>
        <p class="mb-3">As a user of our platform, you agree to:</p>
        <ul class="list-disc list-inside space-y-1 ml-4">
          <li>Provide accurate and truthful information</li>
          <li>Respect other community members</li>
          <li>Not post harmful, offensive, or illegal content</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>
      </section>
      
      <section>
        <h2 class="text-xl font-semibold mb-3">Community Guidelines</h2>
        <p class="mb-3">Our community is built on mutual respect and support. We expect all members to:</p>
        <ul class="list-disc list-inside space-y-1 ml-4">
          <li>Be respectful in all interactions</li>
          <li>Keep discussions relevant and constructive</li>
          <li>Report inappropriate behavior</li>
          <li>Help maintain a welcoming environment</li>
        </ul>
      </section>
      
      <section>
        <h2 class="text-xl font-semibold mb-3">Limitation of Liability</h2>
        <p>UK Chinese Community shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform.</p>
      </section>
      
      <section>
        <h2 class="text-xl font-semibold mb-3">Contact Information</h2>
        <p>For questions about these Terms of Service, please contact us at legal@ukchinesecommunity.com</p>
      </section>
    </div>
  </div>',
  'Terms of Service for UK Chinese Community - understand the rules and guidelines for using our platform.',
  true
),
(
  'help',
  'Help Center',
  '<div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Help Center</h1>
    <p class="text-lg mb-8">Find answers to common questions and get help with using our platform.</p>
    
    <div class="space-y-8">
      <section>
        <h2 class="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        
        <div class="space-y-4">
          <div class="border-l-4 border-blue-500 pl-4">
            <h3 class="font-semibold mb-2">How do I create an account?</h3>
            <p>Click the "Sign Up" button in the top right corner and follow the registration process. You''ll need to provide your email and create a password.</p>
          </div>
          
          <div class="border-l-4 border-blue-500 pl-4">
            <h3 class="font-semibold mb-2">How do I join a community group?</h3>
            <p>Browse our Groups section and click "Join" on any group that interests you. Some groups may require approval from moderators.</p>
          </div>
          
          <div class="border-l-4 border-blue-500 pl-4">
            <h3 class="font-semibold mb-2">How do I post in the forum?</h3>
            <p>Navigate to the Forum section, choose a category, and click "Create Post". Make sure to follow our community guidelines.</p>
          </div>
          
          <div class="border-l-4 border-blue-500 pl-4">
            <h3 class="font-semibold mb-2">How do I report inappropriate content?</h3>
            <p>Use the "Report" button available on posts and comments. Our moderation team will review all reports promptly.</p>
          </div>
        </div>
      </section>
      
      <section>
        <h2 class="text-2xl font-semibold mb-4">Getting Started</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-semibold mb-2">New Members</h3>
            <ul class="space-y-1">
              <li>• Complete your profile</li>
              <li>• Introduce yourself in the forum</li>
              <li>• Join relevant groups</li>
              <li>• Explore upcoming events</li>
            </ul>
          </div>
          
          <div>
            <h3 class="font-semibold mb-2">Community Features</h3>
            <ul class="space-y-1">
              <li>• Discussion Forums</li>
              <li>• Community Groups</li>
              <li>• Event Calendar</li>
              <li>• Resource Library</li>
            </ul>
          </div>
        </div>
      </section>
      
      <section>
        <h2 class="text-2xl font-semibold mb-4">Need More Help?</h2>
        <p class="mb-4">Can''t find what you''re looking for? We''re here to help!</p>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p><strong>Email:</strong> support@ukchinesecommunity.com</p>
          <p><strong>Response Time:</strong> Usually within 24 hours</p>
        </div>
      </section>
    </div>
  </div>',
  'Help Center for UK Chinese Community - find answers to common questions and get support.',
  true
); 