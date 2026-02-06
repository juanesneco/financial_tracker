export type Database = {
  public: {
    Tables: {
      ft_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          currency?: string;
          updated_at?: string;
        };
      };
      ft_categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          color: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon: string;
          color: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
          display_order?: number;
        };
      };
      ft_subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          display_order?: number;
        };
      };
      ft_expenses: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category_id: string;
          subcategory_id: string | null;
          date: string;
          note: string | null;
          receipt_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category_id: string;
          subcategory_id?: string | null;
          date: string;
          note?: string | null;
          receipt_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          subcategory_id?: string | null;
          date?: string;
          note?: string | null;
          receipt_url?: string | null;
          updated_at?: string;
        };
      };
      otp_codes: {
        Row: {
          id: string;
          email: string;
          code: string;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          code: string;
          expires_at: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          used?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
