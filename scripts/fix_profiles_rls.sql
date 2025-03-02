-- profiles テーブルのRLSポリシーを修正

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

-- サービスロールにすべての権限を付与（オプション、必要に応じて）
CREATE POLICY "Service role has full access to profiles" 
ON public.profiles
TO service_role
USING (true)
WITH CHECK (true);
