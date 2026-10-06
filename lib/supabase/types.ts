export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          company: string | null;
          message: string;
          source: string;
          service: string | null;
          budget: number | null;
          currency: string;
          timeline: string | null;
          ai_score: number | null;
          qualification: string | null;
          intent: string | null;
          urgency: string | null;
          ai_summary: string | null;
          ai_reasoning: string | null;
          missing_information: Json | null;
          recommended_action: string | null;
          status: string;
          response_status: string;
          last_contacted_at: string | null;
          next_follow_up_at: string | null;
          follow_up_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          company?: string | null;
          message: string;
          source?: string;
          service?: string | null;
          budget?: number | null;
          currency?: string;
          timeline?: string | null;
          ai_score?: number | null;
          qualification?: string | null;
          intent?: string | null;
          urgency?: string | null;
          ai_summary?: string | null;
          ai_reasoning?: string | null;
          missing_information?: Json | null;
          recommended_action?: string | null;
          status?: string;
          response_status?: string;
          last_contacted_at?: string | null;
          next_follow_up_at?: string | null;
          follow_up_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          company?: string | null;
          message?: string;
          source?: string;
          service?: string | null;
          budget?: number | null;
          currency?: string;
          timeline?: string | null;
          ai_score?: number | null;
          qualification?: string | null;
          intent?: string | null;
          urgency?: string | null;
          ai_summary?: string | null;
          ai_reasoning?: string | null;
          missing_information?: Json | null;
          recommended_action?: string | null;
          status?: string;
          response_status?: string;
          last_contacted_at?: string | null;
          next_follow_up_at?: string | null;
          follow_up_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      communications: {
        Row: {
          id: string;
          lead_id: string;
          type: string;
          subject: string;
          body: string;
          status: string;
          created_at: string;
          updated_at: string;
          approved_at: string | null;
          sent_at: string | null;
          gmail_message_id: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          type?: string;
          subject: string;
          body: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          approved_at?: string | null;
          sent_at?: string | null;
          gmail_message_id?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string;
          type?: string;
          subject?: string;
          body?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          approved_at?: string | null;
          sent_at?: string | null;
          gmail_message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "communications_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
      follow_ups: {
        Row: {
          id: string;
          lead_id: string;
          follow_up_number: number;
          scheduled_for: string;
          status: string;
          reason: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          follow_up_number: number;
          scheduled_for: string;
          status?: string;
          reason?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          lead_id?: string;
          follow_up_number?: number;
          scheduled_for?: string;
          status?: string;
          reason?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          }
        ];
      };
      oauth_tokens: {
        Row: {
          id: string;
          provider: string;
          access_token: string;
          refresh_token: string | null;
          scope: string | null;
          token_type: string | null;
          expiry_date: number | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          provider?: string;
          access_token: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_type?: string | null;
          expiry_date?: number | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          access_token?: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_type?: string | null;
          expiry_date?: number | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
