-- profiles テーブルのRLSポリシーを簡易的に修正

-- RLSを一時的に無効化
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;

-- RLSを再度有効化
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
