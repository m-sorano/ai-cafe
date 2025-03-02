import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // profiles テーブルの updated_at カラムを追加
    const { error: profilesUpdateError } = await supabase.rpc('execute_sql', {
      sql_query: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'profiles'
                AND column_name = 'updated_at'
            ) THEN
                ALTER TABLE public.profiles
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            END IF;
        END $$;
      `
    });

    if (profilesUpdateError) {
      console.error('Error updating profiles table:', profilesUpdateError);
      // エラーがあっても続行
    }

    // profiles テーブルのRLSポリシーを修正
    const { error: profilesRlsError } = await supabase.rpc('execute_sql', {
      sql_query: `
        -- まず既存のポリシーを確認して削除
        DO $$
        DECLARE
            policy_exists BOOLEAN;
        BEGIN
            SELECT EXISTS (
                SELECT 1
                FROM pg_policies
                WHERE tablename = 'profiles'
            ) INTO policy_exists;
            
            IF policy_exists THEN
                -- 既存のポリシーを削除（ポリシー名が不明な場合は手動で確認して修正）
                DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
                DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
                DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
                DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;
            END IF;
        END $$;

        -- RLSが有効になっていることを確認
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        -- 全ユーザーに読み取り権限を付与
        CREATE POLICY "Public profiles are viewable by everyone" 
        ON public.profiles FOR SELECT 
        USING (true);

        -- 認証済みユーザーに自分のプロフィールの挿入権限を付与
        CREATE POLICY "Users can insert their own profile" 
        ON public.profiles FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = id);

        -- 認証済みユーザーに自分のプロフィールの更新権限を付与
        CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE 
        TO authenticated 
        USING (auth.uid() = id);

        -- サービスロールにすべての権限を付与
        CREATE POLICY "Service role has full access to profiles" 
        ON public.profiles
        TO service_role
        USING (true)
        WITH CHECK (true);
      `
    });

    if (profilesRlsError) {
      console.error('Error updating profiles RLS policies:', profilesRlsError);
      // エラーがあっても続行
    }

    // knowledge_cards テーブルの作成
    const { error: createTableError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.knowledge_cards (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          tags TEXT[] DEFAULT '{}',
          source_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- RLSポリシーの設定
        ALTER TABLE public.knowledge_cards ENABLE ROW LEVEL SECURITY;
        
        -- 全ユーザーに読み取り権限を付与
        CREATE POLICY "Knowledge cards are viewable by everyone" 
        ON public.knowledge_cards FOR SELECT 
        USING (true);
        
        -- 認証済みユーザーに挿入権限を付与
        CREATE POLICY "Authenticated users can insert knowledge cards" 
        ON public.knowledge_cards FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
        
        -- サービスロールにすべての権限を付与
        CREATE POLICY "Service role has full access to knowledge cards" 
        ON public.knowledge_cards
        TO service_role
        USING (true)
        WITH CHECK (true);
        
        -- インデックスの作成
        CREATE INDEX IF NOT EXISTS knowledge_cards_source_post_id_idx ON public.knowledge_cards(source_post_id);
        CREATE INDEX IF NOT EXISTS knowledge_cards_created_at_idx ON public.knowledge_cards(created_at);
      `
    });

    if (createTableError) {
      throw createTableError;
    }

    return res.status(200).json({ success: true, message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Error setting up database:', error);
    return res.status(500).json({ error: error.message });
  }
}
