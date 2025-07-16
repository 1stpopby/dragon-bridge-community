import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface FooterPageData {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  is_published: boolean;
}

const FooterPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const [page, setPage] = useState<FooterPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get the slug from URL params or extract from pathname
    const pageSlug = slug || location.pathname.substring(1);
    
    if (pageSlug) {
      fetchPage(pageSlug);
    } else {
      setNotFound(true);
      setLoading(false);
    }
  }, [slug, location.pathname]);

  const fetchPage = async (pageSlug: string) => {
    try {
      setLoading(true);
      setNotFound(false);
      
      const { data, error } = await supabase
        .from('footer_pages')
        .select('*')
        .eq('slug', pageSlug)
        .eq('is_published', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
          setNotFound(true);
        } else {
          toast({
            title: "Error loading page",
            description: "Failed to load the requested page. Please try again.",
            variant: "destructive",
          });
          setNotFound(true);
        }
        return;
      }

      setPage(data);
      
      // Update page title and meta description
      if (data) {
        document.title = `${data.title} - UK Chinese Community`;
        if (data.meta_description) {
          let metaDescription = document.querySelector('meta[name="description"]');
          if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
          }
          metaDescription.setAttribute('content', data.meta_description);
        }
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      toast({
        title: "Error loading page",
        description: "Failed to load the requested page. Please try again.",
        variant: "destructive",
      });
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Page Not Found</h1>
            <p className="text-lg text-muted-foreground mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link 
              to="/"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go Back Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Special handling for contact page to show the contact form
  if (page.slug === 'contact') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <ContactForm />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
      <Footer />
    </div>
  );
};

export default FooterPage; 