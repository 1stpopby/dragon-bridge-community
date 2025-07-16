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

CREATE POLICY "Admins can manage all footer pages" 
ON public.footer_pages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_footer_pages_slug ON public.footer_pages(slug);
CREATE INDEX IF NOT EXISTS idx_footer_pages_published ON public.footer_pages(is_published);

-- Create trigger for updated_at
CREATE TRIGGER update_footer_pages_updated_at
  BEFORE UPDATE ON public.footer_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pages
INSERT INTO public.footer_pages (slug, title, content, meta_description, is_published) VALUES
('contact', 'Contact Us', '<div class="max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Contact Us</h1>
  <p class="text-lg mb-6">We''d love to hear from you! Get in touch with the UK Chinese Community team.</p>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
    <div>
      <h2 class="text-xl font-semibold mb-4">Get in Touch</h2>
      <div class="space-y-3">
        <div class="flex items-center space-x-3">
          <span class="font-medium">Email:</span>
          <a href="mailto:admin@ukchinesecommunity.com" class="text-primary hover:underline">admin@ukchinesecommunity.com</a>
        </div>
        <div class="flex items-center space-x-3">
          <span class="font-medium">Phone:</span>
          <a href="tel:+442012345678" class="text-primary hover:underline">+44 20 1234 5678</a>
        </div>
        <div class="flex items-start space-x-3">
          <span class="font-medium">Address:</span>
          <div>
            123 Community Street<br>
            London E1 6AN<br>
            United Kingdom
          </div>
        </div>
      </div>
    </div>
    
    <div>
      <h2 class="text-xl font-semibold mb-4">Office Hours</h2>
      <div class="space-y-2">
        <div class="flex justify-between">
          <span>Monday - Friday:</span>
          <span>9:00 AM - 6:00 PM</span>
        </div>
        <div class="flex justify-between">
          <span>Saturday:</span>
          <span>10:00 AM - 4:00 PM</span>
        </div>
        <div class="flex justify-between">
          <span>Sunday:</span>
          <span>Closed</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="bg-muted p-6 rounded-lg">
    <h2 class="text-xl font-semibold mb-4">Send us a Message</h2>
    <p class="text-muted-foreground mb-4">For general inquiries, support, or feedback, please don''t hesitate to reach out. We typically respond within 24 hours.</p>
    <div class="flex flex-wrap gap-2">
      <span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">General Support</span>
      <span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">Technical Issues</span>
      <span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">Community Feedback</span>
      <span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">Partnership Inquiries</span>
    </div>
  </div>
</div>', 'Contact the UK Chinese Community team for support, feedback, and inquiries', true),

('privacy', 'Privacy Policy', '<div class="max-w-4xl mx-auto prose prose-lg">
  <h1>Privacy Policy</h1>
  <p class="text-muted-foreground">Last updated: January 2024</p>
  
  <h2>Information We Collect</h2>
  <p>We collect information you provide directly to us, such as when you create an account, participate in community discussions, or contact us for support.</p>
  
  <h2>How We Use Your Information</h2>
  <p>We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure the security of our platform.</p>
  
  <h2>Information Sharing</h2>
  <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
  
  <h2>Data Security</h2>
  <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
  
  <h2>Your Rights</h2>
  <p>You have the right to access, update, or delete your personal information. You can do this through your account settings or by contacting us directly.</p>
  
  <h2>Contact Us</h2>
  <p>If you have any questions about this Privacy Policy, please contact us at admin@ukchinesecommunity.com.</p>
</div>', 'Privacy Policy for UK Chinese Community platform', true),

('terms', 'Terms of Service', '<div class="max-w-4xl mx-auto prose prose-lg">
  <h1>Terms of Service</h1>
  <p class="text-muted-foreground">Last updated: January 2024</p>
  
  <h2>Acceptance of Terms</h2>
  <p>By accessing and using the UK Chinese Community platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
  
  <h2>Community Guidelines</h2>
  <p>Users are expected to maintain respectful and constructive interactions. Harassment, discrimination, or inappropriate content will not be tolerated.</p>
  
  <h2>User Content</h2>
  <p>You retain ownership of content you post, but grant us a license to use, modify, and distribute it as necessary to provide our services.</p>
  
  <h2>Prohibited Activities</h2>
  <p>Users may not engage in spam, illegal activities, or attempts to compromise the security of the platform.</p>
  
  <h2>Account Termination</h2>
  <p>We reserve the right to terminate accounts that violate these terms or engage in harmful behavior.</p>
  
  <h2>Limitation of Liability</h2>
  <p>The platform is provided "as is" and we make no warranties about its availability or functionality.</p>
  
  <h2>Changes to Terms</h2>
  <p>We may update these terms from time to time. Continued use of the platform constitutes acceptance of any changes.</p>
  
  <h2>Contact Information</h2>
  <p>For questions about these terms, please contact us at admin@ukchinesecommunity.com.</p>
</div>', 'Terms of Service for UK Chinese Community platform', true),

('help', 'Help Center', '<div class="max-w-4xl mx-auto">
  <h1 class="text-3xl font-bold mb-6">Help Center</h1>
  <p class="text-lg mb-8">Find answers to common questions and learn how to make the most of our community platform.</p>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-semibold mb-3">Getting Started</h2>
        <ul class="space-y-2 text-muted-foreground">
          <li>• How to create an account</li>
          <li>• Setting up your profile</li>
          <li>• Joining community groups</li>
          <li>• Posting in the forum</li>
        </ul>
      </div>
      
      <div>
        <h2 class="text-xl font-semibold mb-3">Community Features</h2>
        <ul class="space-y-2 text-muted-foreground">
          <li>• Finding local events</li>
          <li>• Using the marketplace</li>
          <li>• Accessing resources</li>
          <li>• Connecting with services</li>
        </ul>
      </div>
    </div>
    
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-semibold mb-3">Account Management</h2>
        <ul class="space-y-2 text-muted-foreground">
          <li>• Updating your information</li>
          <li>• Privacy settings</li>
          <li>• Notification preferences</li>
          <li>• Deleting your account</li>
        </ul>
      </div>
      
      <div>
        <h2 class="text-xl font-semibold mb-3">Troubleshooting</h2>
        <ul class="space-y-2 text-muted-foreground">
          <li>• Login issues</li>
          <li>• Technical problems</li>
          <li>• Reporting inappropriate content</li>
          <li>• Contact support</li>
        </ul>
      </div>
    </div>
  </div>
  
  <div class="mt-12 bg-muted p-6 rounded-lg text-center">
    <h2 class="text-xl font-semibold mb-2">Still Need Help?</h2>
    <p class="text-muted-foreground mb-4">Can''t find what you''re looking for? Our support team is here to help.</p>
    <a href="/contact" class="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
      Contact Support
    </a>
  </div>
</div>', 'Help Center with guides and FAQs for UK Chinese Community', true)

ON CONFLICT (slug) DO NOTHING; 