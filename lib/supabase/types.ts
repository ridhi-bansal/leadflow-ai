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
