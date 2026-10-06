export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null;
          icon: string | null;
          id: string;
          name: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          color?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          user_id?: string;
        };
        Update: {
          color?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      habit_marks: {
        Row: {
          habit_id: string;
          marked_at: string;
          occurrence_date: string;
          status: Database['public']['Enums']['mark_status'];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          habit_id: string;
          marked_at?: string;
          occurrence_date: string;
          status: Database['public']['Enums']['mark_status'];
          user_id?: string;
        };
        Update: {
          habit_id?: string;
          marked_at?: string;
          occurrence_date?: string;
          status?: Database['public']['Enums']['mark_status'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'habit_marks_habit_id_user_id_fkey';
            columns: ['habit_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'habits';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      habit_rules: {
        Row: {
          frequency: Database['public']['Enums']['habit_frequency'];
          habit_id: string;
          id: string;
          interval_days: number | null;
          user_id: string;
          valid_from: string;
          weekdays: number[] | null;
        };
        ComputedFields: never;
        Insert: {
          frequency: Database['public']['Enums']['habit_frequency'];
          habit_id: string;
          id?: string;
          interval_days?: number | null;
          user_id?: string;
          valid_from: string;
          weekdays?: number[] | null;
        };
        Update: {
          frequency?: Database['public']['Enums']['habit_frequency'];
          habit_id?: string;
          id?: string;
          interval_days?: number | null;
          user_id?: string;
          valid_from?: string;
          weekdays?: number[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'habit_rules_habit_id_user_id_fkey';
            columns: ['habit_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'habits';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      habits: {
        Row: {
          archived_at: string | null;
          category_id: string | null;
          duration_minutes: number | null;
          id: string;
          name: string;
          section_id: string | null;
          start_date: string;
          time_of_day: string | null;
          time_slot: Database['public']['Enums']['habit_time_slot'] | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          category_id?: string | null;
          duration_minutes?: number | null;
          id?: string;
          name: string;
          section_id?: string | null;
          start_date: string;
          time_of_day?: string | null;
          time_slot?: Database['public']['Enums']['habit_time_slot'] | null;
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          category_id?: string | null;
          duration_minutes?: number | null;
          id?: string;
          name?: string;
          section_id?: string | null;
          start_date?: string;
          time_of_day?: string | null;
          time_slot?: Database['public']['Enums']['habit_time_slot'] | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'habits_category_id_user_id_fkey';
            columns: ['category_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'habits_section_id_category_id_user_id_fkey';
            columns: ['section_id', 'category_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'sections';
            referencedColumns: ['id', 'category_id', 'user_id'];
          },
        ];
      };
      sections: {
        Row: {
          category_id: string;
          id: string;
          name: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          id?: string;
          name: string;
          user_id?: string;
        };
        Update: {
          category_id?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sections_category_id_user_id_fkey';
            columns: ['category_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      tasks: {
        Row: {
          archived_at: string | null;
          category_id: string | null;
          due_date: string | null;
          due_time: string | null;
          id: string;
          marked_at: string | null;
          name: string;
          notes: string | null;
          section_id: string | null;
          status: Database['public']['Enums']['task_status'];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          category_id?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          id?: string;
          marked_at?: string | null;
          name: string;
          notes?: string | null;
          section_id?: string | null;
          status?: Database['public']['Enums']['task_status'];
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          category_id?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          id?: string;
          marked_at?: string | null;
          name?: string;
          notes?: string | null;
          section_id?: string | null;
          status?: Database['public']['Enums']['task_status'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_category_id_user_id_fkey';
            columns: ['category_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'tasks_section_id_category_id_user_id_fkey';
            columns: ['section_id', 'category_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'sections';
            referencedColumns: ['id', 'category_id', 'user_id'];
          },
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
      habit_frequency: 'daily' | 'weekdays' | 'every_n_days' | 'monthly';
      habit_time_slot: 'morning' | 'afternoon' | 'night';
      mark_status: 'done' | 'not_done';
      task_status: 'pending' | 'done' | 'not_done';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      habit_frequency: ['daily', 'weekdays', 'every_n_days', 'monthly'],
      habit_time_slot: ['morning', 'afternoon', 'night'],
      mark_status: ['done', 'not_done'],
      task_status: ['pending', 'done', 'not_done'],
    },
  },
} as const;
