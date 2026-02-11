export type Database = {
  public: {
    Tables: {
      ft_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          currency: string;
          role: string | null;
          avatar_url: string | null;
          is_super_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          currency?: string;
          role?: string | null;
          avatar_url?: string | null;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          currency?: string;
          role?: string | null;
          avatar_url?: string | null;
          is_super_admin?: boolean;
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
          emoji: string | null;
          budget_default: number | null;
          original_glide_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon: string;
          color: string;
          display_order?: number;
          emoji?: string | null;
          budget_default?: number | null;
          original_glide_id?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
          display_order?: number;
          emoji?: string | null;
          budget_default?: number | null;
        };
      };
      ft_subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          display_order: number;
          emoji: string | null;
          original_glide_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          display_order?: number;
          emoji?: string | null;
          original_glide_id?: string | null;
          created_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          display_order?: number;
          emoji?: string | null;
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
          title: string | null;
          note: string | null;
          payment_method: "card" | "cash" | null;
          card_id: string | null;
          comments: string | null;
          currency: string;
          receipt_url: string | null;
          original_glide_id: string | null;
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
          title?: string | null;
          note?: string | null;
          payment_method?: "card" | "cash" | null;
          card_id?: string | null;
          comments?: string | null;
          currency?: string;
          receipt_url?: string | null;
          original_glide_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          subcategory_id?: string | null;
          date?: string;
          title?: string | null;
          note?: string | null;
          payment_method?: "card" | "cash" | null;
          card_id?: string | null;
          comments?: string | null;
          currency?: string;
          receipt_url?: string | null;
          updated_at?: string;
        };
      };
      ft_cards: {
        Row: {
          id: string;
          user_id: string;
          bank: string;
          last_four: string | null;
          card_type: "credit" | "debit" | null;
          label: string | null;
          original_glide_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank: string;
          last_four?: string | null;
          card_type?: "credit" | "debit" | null;
          label?: string | null;
          original_glide_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bank?: string;
          last_four?: string | null;
          card_type?: "credit" | "debit" | null;
          label?: string | null;
          updated_at?: string;
        };
      };
      ft_deposits: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          date: string;
          title: string | null;
          note: string | null;
          original_glide_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          date: string;
          title?: string | null;
          note?: string | null;
          original_glide_id?: string | null;
          created_at?: string;
        };
        Update: {
          amount?: number;
          date?: string;
          title?: string | null;
          note?: string | null;
        };
      };
      ft_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          amount: number;
          currency: string;
          renewal_day: number | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          original_glide_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          amount: number;
          currency?: string;
          renewal_day?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          original_glide_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          amount?: number;
          currency?: string;
          renewal_day?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      ft_budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          subcategory_id: string | null;
          amount: number;
          original_glide_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          subcategory_id?: string | null;
          amount: number;
          original_glide_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          subcategory_id?: string | null;
          amount?: number;
          updated_at?: string;
        };
      };
      ft_income_sources: {
        Row: {
          id: string;
          user_id: string;
          source_name: string;
          initials: string | null;
          legal_name: string | null;
          legal_address: string | null;
          legal_city_state_zip: string | null;
          legal_id: string | null;
          original_glide_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_name: string;
          initials?: string | null;
          legal_name?: string | null;
          legal_address?: string | null;
          legal_city_state_zip?: string | null;
          legal_id?: string | null;
          original_glide_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          source_name?: string;
          initials?: string | null;
          legal_name?: string | null;
          legal_address?: string | null;
          legal_city_state_zip?: string | null;
          legal_id?: string | null;
          updated_at?: string;
        };
      };
      ft_income_records: {
        Row: {
          id: string;
          user_id: string;
          income_source_id: string | null;
          amount: number;
          currency: string;
          date: string;
          description: string | null;
          original_glide_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          income_source_id?: string | null;
          amount: number;
          currency?: string;
          date: string;
          description?: string | null;
          original_glide_id?: string | null;
          created_at?: string;
        };
        Update: {
          income_source_id?: string | null;
          amount?: number;
          currency?: string;
          date?: string;
          description?: string | null;
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
