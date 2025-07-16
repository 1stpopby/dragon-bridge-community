import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, Video, Globe, ExternalLink, Mail } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SendMessageDialog } from "./SendMessageDialog";

interface ResourceViewDialogProps {
  resource: any;
  children: React.ReactNode;
}

export function ResourceViewDialog({ resource, children }: ResourceViewDialogProps) {
  const [open, setOpen] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const getIcon = () => {
    switch (resource.resource_type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'website':
        return <Globe className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getVariantForCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case 'healthcare': return 'default';
      case 'finance': return 'secondary';
      case 'education': return 'outline';
      case 'housing': return 'secondary';
      default: return 'secondary';
    }
  };


  const renderContent = () => {
    if (resource.resource_type === 'video' && resource.content_url) {
      // Extract video ID for YouTube embeds
      const youtubeMatch = resource.content_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      const vimeoMatch = resource.content_url.match(/vimeo\.com\/(\d+)/);
      
      if (youtubeMatch) {
        return (
          <div className="space-y-4">
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
                title={resource.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            </div>
            {resource.description && (
              <div>
                <h4 className="font-semibold mb-2">About this video</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{resource.description}</p>
              </div>
            )}
          </div>
        );
      } else if (vimeoMatch) {
        return (
          <div className="space-y-4">
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                title={resource.title}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            </div>
            {resource.description && (
              <div>
                <h4 className="font-semibold mb-2">About this video</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{resource.description}</p>
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed border-border rounded-lg text-center">
              <Video className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium mb-2">Video Content</p>
              <p className="text-sm text-muted-foreground mb-4">
                This video is hosted externally. Click below to watch.
              </p>
              <Button size="sm" onClick={() => window.open(resource.content_url, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Watch Video
              </Button>
            </div>
            {resource.description && (
              <div>
                <h4 className="font-semibold mb-2">About this video</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{resource.description}</p>
              </div>
            )}
          </div>
        );
      }
    }

    if (resource.resource_type === 'website' && resource.content_url) {
      return (
        <div className="space-y-4">
          <div className="p-6 border-2 border-dashed border-border rounded-lg text-center">
            <Globe className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium mb-2">External Website</p>
            <p className="text-sm text-muted-foreground mb-4">
              This resource links to an external website. Click below to visit.
            </p>
            <Button size="sm" onClick={() => window.open(resource.content_url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Website
            </Button>
          </div>
          {resource.description && (
            <div>
              <h4 className="font-semibold mb-2">About this resource</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{resource.description}</p>
            </div>
          )}
        </div>
      );
    }

    // For guides and documents
    return (
      <div className="space-y-4">
        {resource.description && (
          <div>
            <h4 className="font-semibold mb-2">Overview</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{resource.description}</p>
          </div>
        )}
        
        <div className="p-6 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resource Content
          </h4>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This resource contains comprehensive information about {resource.title.toLowerCase()}.
            </p>
            
            {resource.tags && resource.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Key Topics:</p>
                <div className="flex flex-wrap gap-1">
                  {resource.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {resource.content_url && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium mb-2">Additional Resources:</p>
                <Button size="sm" variant="outline" onClick={() => window.open(resource.content_url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Access Full Document
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h5 className="font-semibold text-sm mb-2">How to Use This Resource</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Review the overview section above for key information</li>
            <li>• Check the key topics covered in this resource</li>
            <li>• Access additional documentation if available</li>
            <li>• Contact the author if you need further assistance</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <Badge variant={getVariantForCategory(resource.category)}>
              {resource.category}
            </Badge>
            {resource.duration && (
              <span className="text-sm text-muted-foreground">{resource.duration}</span>
            )}
          </div>
          <DialogTitle className="text-xl flex items-center gap-3">
            {getIcon()}
            {resource.title}
          </DialogTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>By {resource.author_name}</span>
            <div className="flex items-center gap-4">
              {(resource.resource_type === 'video' || resource.resource_type === 'website') && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {resource.view_count || 0} views
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {renderContent()}
          
          {/* Contact Author Section */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">Need more help?</h4>
                <p className="text-xs text-muted-foreground">Send a message to the author</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowMessageDialog(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Message Author
              </Button>
            </div>
          </div>
        </ScrollArea>
        
        <SendMessageDialog
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
          recipientName={resource.author_name}
          recipientId={resource.user_id}
          prefilledMessage={`Hi ${resource.author_name},\n\nI have a question about your resource "${resource.title}".\n\n`}
        />
      </DialogContent>
    </Dialog>
  );
}