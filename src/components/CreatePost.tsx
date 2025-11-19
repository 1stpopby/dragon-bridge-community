import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ImageIcon, Send, X, Smile, Hash, AtSign, Eye, EyeOff } from "lucide-react";

interface CreatePostProps {
  onPostCreated: (post: any) => void;
}

interface MentionUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

// Common emoji reactions
const EMOJI_REACTIONS = [
  '😀', '😂', '😊', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯',
  '🎉', '😎', '🤗', '😢', '😡', '🙏', '👏', '🚀', '💪', '🌟'
];

// Common hashtags
const SUGGESTED_HASHTAGS = [
  '#ChineseCommunity', '#UKLife', '#London', '#Edinburgh', '#Business',
  '#Networking', '#Events', '#Culture', '#Food', '#Travel', '#Career',
  '#Education', '#Technology', '#Healthcare', '#Legal', '#Finance'
];

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  // Close mention dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(event.target as Node)) {
        setShowMentionSuggestions(false);
      }
    };

    if (showMentionSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMentionSuggestions]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const fetchMentionUsers = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .ilike('display_name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setMentionUsers(data || []);
    } catch (error) {
      console.error('Error fetching mention users:', error);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setContent(value);
    setCursorPosition(position);

    // Check for mentions (@)
    const lastAtIndex = value.lastIndexOf('@', position - 1);
    if (lastAtIndex !== -1 && lastAtIndex === position - 1) {
      setShowMentionSuggestions(true);
      fetchMentionUsers('');
    } else if (lastAtIndex !== -1) {
      const mentionText = value.substring(lastAtIndex + 1, position);
      if (mentionText.includes(' ')) {
        setShowMentionSuggestions(false);
      } else {
        setShowMentionSuggestions(true);
        fetchMentionUsers(mentionText);
      }
    } else {
      setShowMentionSuggestions(false);
    }

    // Check for hashtags (#)
    const lastHashIndex = value.lastIndexOf('#', position - 1);
    if (lastHashIndex !== -1 && lastHashIndex === position - 1) {
      setShowHashtagSuggestions(true);
    } else if (lastHashIndex !== -1) {
      const hashtagText = value.substring(lastHashIndex + 1, position);
      if (hashtagText.includes(' ')) {
        setShowHashtagSuggestions(false);
      } else {
        setShowHashtagSuggestions(true);
      }
    } else {
      setShowHashtagSuggestions(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const newContent = content.slice(0, cursorPosition) + emoji + content.slice(cursorPosition);
    setContent(newContent);
    setCursorPosition(cursorPosition + emoji.length);
    setShowEmojiPicker(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const insertHashtag = (hashtag: string) => {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const lastHashIndex = beforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const newContent = beforeCursor.slice(0, lastHashIndex) + hashtag + ' ' + afterCursor;
      setContent(newContent);
      setCursorPosition(lastHashIndex + hashtag.length + 1);
    }
    setShowHashtagSuggestions(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const insertMention = (user: MentionUser) => {
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const mention = `@${user.display_name}`;
      const newContent = beforeCursor.slice(0, lastAtIndex) + mention + ' ' + afterCursor;
      setContent(newContent);
      setCursorPosition(lastAtIndex + mention.length + 1);
    }
    setShowMentionSuggestions(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `posts/${user?.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images') // Reusing existing bucket
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('event-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !selectedImage) {
      toast({
        title: "Post cannot be empty",
        description: "Please add some content or an image.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      let imageUrl = null;
      
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id,
          author_name: profile?.display_name || user?.email?.split('@')[0] || 'Unknown User',
          author_avatar: profile?.avatar_url,
          content: content.trim(),
          image_url: imageUrl
        })
        .select()
        .single();

      if (error) throw error;

      onPostCreated({
        ...data,
        user_liked: false
      });

      setContent("");
      removeImage();
      setIsFocused(false);
      
      toast({
        title: "Post published!",
        description: "Your post has been shared with the community.",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  const maxChars = 500;
  const charCount = content.length;
  const isNearLimit = charCount > maxChars * 0.8;

  return (
    <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} alt="Your avatar" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="What's happening in your community?"
                  value={content}
                  onChange={handleContentChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={(e) => {
                    // Only blur if not clicking on action buttons
                    if (!e.relatedTarget?.closest('.action-buttons')) {
                      setTimeout(() => setIsFocused(false), 150);
                    }
                  }}
                  className="min-h-[60px] resize-none border-0 focus-visible:ring-0 text-base p-0 placeholder:text-muted-foreground/60"
                  disabled={uploading}
                  maxLength={maxChars}
                />
                
                {/* Character count */}
                {isFocused && content.length > 0 && (
                  <div className="absolute bottom-2 right-2">
                    <Badge variant={isNearLimit ? "destructive" : "secondary"} className="text-xs">
                      {charCount}/{maxChars}
                    </Badge>
                  </div>
                )}

                {/* Quick actions when not focused */}
                {!isFocused && (
                  <div className="absolute right-2 top-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 p-0"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Mention suggestions */}
                {showMentionSuggestions && mentionUsers.length > 0 && (
                  <div 
                    ref={mentionDropdownRef}
                    className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-lg shadow-lg z-50"
                  >
                    <div className="p-2 border-b">
                      <p className="text-sm font-medium">Mention someone</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {mentionUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => insertMention(user)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-muted text-left"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {user.display_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{user.display_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hashtag suggestions */}
                {showHashtagSuggestions && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-lg shadow-lg z-10">
                    <div className="p-2 border-b">
                      <p className="text-sm font-medium">Suggested hashtags</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {SUGGESTED_HASHTAGS.map((hashtag) => (
                        <button
                          key={hashtag}
                          type="button"
                          onClick={() => insertHashtag(hashtag)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-muted text-left"
                        >
                          <Hash className="h-4 w-4 text-primary" />
                          <span className="text-sm">{hashtag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Image preview */}
              {previewUrl && (
                <div className="relative mt-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Actions - Only show when focused */}
              {isFocused && (
                <div className="action-buttons mt-4 space-y-3">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="h-8 px-3 text-sm"
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Photo
                    </Button>
                    
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={uploading}
                          className="h-8 px-3 text-sm"
                        >
                          <Smile className="h-4 w-4 mr-1" />
                          Emoji
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="grid grid-cols-10 gap-2">
                          {EMOJI_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="p-2 hover:bg-muted rounded text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const hashtagText = '#';
                        const newContent = content + hashtagText;
                        setContent(newContent);
                        setCursorPosition(newContent.length);
                        setShowHashtagSuggestions(true);
                        setTimeout(() => textareaRef.current?.focus(), 0);
                      }}
                      disabled={uploading}
                      className="h-8 px-3 text-sm"
                    >
                      <Hash className="h-4 w-4 mr-1" />
                      Hashtag
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const mentionText = '@';
                        const newContent = content + mentionText;
                        setContent(newContent);
                        setCursorPosition(newContent.length);
                        setShowMentionSuggestions(true);
                        fetchMentionUsers('');
                        setTimeout(() => textareaRef.current?.focus(), 0);
                      }}
                      disabled={uploading}
                      className="h-8 px-3 text-sm"
                    >
                      <AtSign className="h-4 w-4 mr-1" />
                      Mention
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsPublic(!isPublic)}
                        disabled={uploading}
                        className="h-8 px-3 text-sm"
                      >
                        {isPublic ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Private
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={uploading || (!content.trim() && !selectedImage)}
                      className="min-w-[80px]"
                    >
                      {uploading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePost;