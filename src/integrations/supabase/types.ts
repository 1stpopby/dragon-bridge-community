export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          click_count: number | null
          company_id: string | null
          created_at: string
          created_by: string
          description: string
          end_date: string | null
          external_link: string | null
          id: string
          image_url: string | null
          link_type: string
          placement_locations: string[]
          priority: number | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          click_count?: number | null
          company_id?: string | null
          created_at?: string
          created_by: string
          description: string
          end_date?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          link_type?: string
          placement_locations?: string[]
          priority?: number | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          click_count?: number | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          end_date?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          link_type?: string
          placement_locations?: string[]
          priority?: number | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          notification_sent: boolean | null
          priority: string
          published_at: string | null
          status: string
          target_audience: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          notification_sent?: boolean | null
          priority?: string
          published_at?: string | null
          status?: string
          target_audience?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          notification_sent?: boolean | null
          priority?: string
          published_at?: string | null
          status?: string
          target_audience?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          setting_key: string
          setting_type: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_groups: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string
          member_count: number | null
          name: string
          organizer_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location: string
          member_count?: number | null
          name: string
          organizer_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          member_count?: number | null
          name?: string
          organizer_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      company_feedback: {
        Row: {
          company_id: string
          company_response_rating: number | null
          company_response_text: string | null
          completion_date: string | null
          created_at: string | null
          feedback_text: string | null
          id: string
          is_verified: boolean | null
          project_type: string | null
          rating: number
          reviewer_email: string | null
          reviewer_name: string
          service_inquiry_id: string | null
          updated_at: string | null
          user_review_id: string | null
        }
        Insert: {
          company_id: string
          company_response_rating?: number | null
          company_response_text?: string | null
          completion_date?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_verified?: boolean | null
          project_type?: string | null
          rating: number
          reviewer_email?: string | null
          reviewer_name: string
          service_inquiry_id?: string | null
          updated_at?: string | null
          user_review_id?: string | null
        }
        Update: {
          company_id?: string
          company_response_rating?: number | null
          company_response_text?: string | null
          completion_date?: string | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_verified?: boolean | null
          project_type?: string | null
          rating?: number
          reviewer_email?: string | null
          reviewer_name?: string
          service_inquiry_id?: string | null
          updated_at?: string | null
          user_review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_feedback_service_inquiry_id_fkey"
            columns: ["service_inquiry_id"]
            isOneToOne: false
            referencedRelation: "service_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_feedback_user_review_id_fkey"
            columns: ["user_review_id"]
            isOneToOne: false
            referencedRelation: "service_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      company_gallery: {
        Row: {
          company_id: string
          completion_date: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_featured: boolean | null
          project_type: string | null
          service_response_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          project_type?: string | null
          service_response_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          project_type?: string | null
          service_response_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_gallery_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_gallery_service_response_id_fkey"
            columns: ["service_response_id"]
            isOneToOne: false
            referencedRelation: "completed_services"
            referencedColumns: ["service_response_id"]
          },
          {
            foreignKeyName: "company_gallery_service_response_id_fkey"
            columns: ["service_response_id"]
            isOneToOne: false
            referencedRelation: "service_request_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      company_reviews: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          rating: number
          reviewer_avatar: string | null
          reviewer_id: string
          reviewer_name: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          rating: number
          reviewer_avatar?: string | null
          reviewer_id: string
          reviewer_name: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          rating?: number
          reviewer_avatar?: string | null
          reviewer_id?: string
          reviewer_name?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_services: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          price_range: string | null
          service_category: string | null
          service_description: string | null
          service_id: string | null
          service_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price_range?: string | null
          service_category?: string | null
          service_description?: string | null
          service_id?: string | null
          service_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price_range?: string | null
          service_category?: string | null
          service_description?: string | null
          service_id?: string | null
          service_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      company_verification_requests: {
        Row: {
          admin_notes: string | null
          company_id: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company_id: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company_id?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_verification_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          attendee_email: string | null
          attendee_name: string
          created_at: string
          event_id: string
          id: string
          phone: string | null
          registration_status: string
          special_requirements: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name: string
          created_at?: string
          event_id: string
          id?: string
          phone?: string | null
          registration_status?: string
          special_requirements?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string
          created_at?: string
          event_id?: string
          id?: string
          phone?: string | null
          registration_status?: string
          special_requirements?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendees: number | null
          author_name: string
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          image_url: string | null
          location: string
          status: string
          time: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attendees?: number | null
          author_name: string
          category: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          location: string
          status?: string
          time?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attendees?: number | null
          author_name?: string
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          status?: string
          time?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      footer_pages: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      forum_post_reactions: {
        Row: {
          author_name: string
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_name: string
          category: string | null
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          category?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_discussion_reactions: {
        Row: {
          author_name: string
          created_at: string
          discussion_id: string
          emoji: string
          id: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          created_at?: string
          discussion_id: string
          emoji: string
          id?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string
          discussion_id?: string
          emoji?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_discussion_reactions_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "group_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      group_discussion_replies: {
        Row: {
          author_avatar: string | null
          author_name: string
          content: string
          created_at: string
          discussion_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          content: string
          created_at?: string
          discussion_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "group_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      group_discussions: {
        Row: {
          author_avatar: string | null
          author_name: string
          content: string
          created_at: string
          group_id: string
          id: string
          likes_count: number | null
          replies_count: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          content: string
          created_at?: string
          group_id: string
          id?: string
          likes_count?: number | null
          replies_count?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          likes_count?: number | null
          replies_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_discussions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          member_name: string
          user_id: string | null
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          member_name: string
          user_id?: string | null
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          member_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_inquiries: {
        Row: {
          created_at: string
          id: string
          inquirer_contact: string
          inquirer_name: string
          item_id: string
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inquirer_contact: string
          inquirer_name: string
          item_id: string
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inquirer_contact?: string
          inquirer_name?: string
          item_id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_inquiries_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_items"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_items: {
        Row: {
          category: string
          condition: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          location: string
          price: number
          seller_contact: string | null
          seller_name: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          condition: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location: string
          price: number
          seller_contact?: string | null
          seller_name: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          price?: number
          seller_contact?: string | null
          seller_name?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_avatar: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_avatar: string | null
          author_name: string
          comments_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          bio: string | null
          company_address: string | null
          company_cover_image: string | null
          company_description: string | null
          company_founded: string | null
          company_name: string | null
          company_phone: string | null
          company_services: string[] | null
          company_size: string | null
          company_website: string | null
          contact_email: string | null
          created_at: string
          display_name: string
          id: string
          is_verified: boolean | null
          location: string | null
          phone: string | null
          rating: number | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_type: string
          avatar_url?: string | null
          bio?: string | null
          company_address?: string | null
          company_cover_image?: string | null
          company_description?: string | null
          company_founded?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_services?: string[] | null
          company_size?: string | null
          company_website?: string | null
          contact_email?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          bio?: string | null
          company_address?: string | null
          company_cover_image?: string | null
          company_description?: string | null
          company_founded?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_services?: string[] | null
          company_size?: string | null
          company_website?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          author_name: string
          category: string
          content_url: string | null
          created_at: string
          description: string | null
          download_count: number | null
          duration: string | null
          file_size: string | null
          file_url: string | null
          id: string
          is_featured: boolean | null
          resource_type: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          author_name: string
          category: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          duration?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          resource_type: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          author_name?: string
          category?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          duration?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          resource_type?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_feedback: {
        Row: {
          comment: string
          communication_rating: number | null
          company_id: string
          created_at: string
          id: string
          rating: number
          request_id: string
          response_id: string
          service_quality_rating: number | null
          timeliness_rating: number | null
          title: string
          updated_at: string
          user_id: string
          value_rating: number | null
          would_recommend: boolean | null
        }
        Insert: {
          comment: string
          communication_rating?: number | null
          company_id: string
          created_at?: string
          id?: string
          rating: number
          request_id: string
          response_id: string
          service_quality_rating?: number | null
          timeliness_rating?: number | null
          title: string
          updated_at?: string
          user_id: string
          value_rating?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          comment?: string
          communication_rating?: number | null
          company_id?: string
          created_at?: string
          id?: string
          rating?: number
          request_id?: string
          response_id?: string
          service_quality_rating?: number | null
          timeliness_rating?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          value_rating?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "service_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_feedback_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "completed_services"
            referencedColumns: ["service_response_id"]
          },
          {
            foreignKeyName: "service_feedback_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "service_request_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_inquiries: {
        Row: {
          created_at: string
          id: string
          inquirer_email: string
          inquirer_name: string
          inquirer_phone: string | null
          inquiry_type: string
          message: string
          responses_count: number | null
          service_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inquirer_email: string
          inquirer_name: string
          inquirer_phone?: string | null
          inquiry_type?: string
          message: string
          responses_count?: number | null
          service_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inquirer_email?: string
          inquirer_name?: string
          inquirer_phone?: string | null
          inquiry_type?: string
          message?: string
          responses_count?: number | null
          service_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_inquiries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_inquiry_conversations: {
        Row: {
          created_at: string
          id: string
          inquiry_id: string
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          inquiry_id: string
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          inquiry_id?: string
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_inquiry_conversations_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "service_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      service_inquiry_responses: {
        Row: {
          company_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          inquiry_id: string
          response_message: string
          updated_at: string
        }
        Insert: {
          company_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          inquiry_id: string
          response_message: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string
          response_message?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_inquiry_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_inquiry_responses_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "service_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          message_type: string
          recipient_id: string
          request_id: string
          response_id: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          message_type?: string
          recipient_id: string
          request_id: string
          response_id?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          message_type?: string
          recipient_id?: string
          request_id?: string
          response_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      service_request_responses: {
        Row: {
          availability: string | null
          company_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          estimated_cost: string | null
          id: string
          request_id: string
          response_message: string
          response_status: string
          updated_at: string
        }
        Insert: {
          availability?: string | null
          company_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          estimated_cost?: string | null
          id?: string
          request_id: string
          response_message: string
          response_status?: string
          updated_at?: string
        }
        Update: {
          availability?: string | null
          company_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          estimated_cost?: string | null
          id?: string
          request_id?: string
          response_message?: string
          response_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_hours: Json | null
          category: string
          contact_person: string | null
          created_at: string
          description: string | null
          email: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          languages: string[] | null
          location: string
          name: string
          phone: string | null
          rating: number | null
          reviews_count: number | null
          specialty: string
          updated_at: string
          user_id: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          business_hours?: Json | null
          category: string
          contact_person?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          languages?: string[] | null
          location: string
          name: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          specialty: string
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          business_hours?: Json | null
          category?: string
          contact_person?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          languages?: string[] | null
          location?: string
          name?: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          specialty?: string
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      user_bans: {
        Row: {
          ban_type: string
          banned_at: string
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          notes: string | null
          reason: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ban_type?: string
          banned_at?: string
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          reason: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ban_type?: string
          banned_at?: string
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          reason?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      completed_services: {
        Row: {
          company_display_name: string | null
          company_id: string | null
          company_name: string | null
          completion_date: string | null
          estimated_cost: string | null
          request_id: string | null
          response_message: string | null
          service_date: string | null
          service_description: string | null
          service_response_id: string | null
          service_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_request_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assign_admin_role_to_email: {
        Args: { user_email: string }
        Returns: undefined
      }
      can_create_events: {
        Args: { _user_id: string }
        Returns: boolean
      }
      get_completed_services_for_company: {
        Args: { company_uuid: string }
        Returns: {
          completion_date: string
          estimated_cost: string
          inquirer_email: string
          inquirer_name: string
          request_id: string
          response_message: string
          service_date: string
          service_description: string
          service_response_id: string
          service_type: string
        }[]
      }
      get_item_inquiry_count: {
        Args: { item_uuid: string }
        Returns: number
      }
      get_safe_profile_data: {
        Args: { profile_user_id: string }
        Returns: {
          account_type: string
          avatar_url: string
          bio: string
          company_name: string
          created_at: string
          display_name: string
          id: string
          is_verified: boolean
          location: string
          user_id: string
        }[]
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { group_id: string; user_id: string }
        Returns: boolean
      }
      is_user_banned: {
        Args: { check_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
