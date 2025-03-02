-- プロフィールテーブルのRLSポリシーを完全にリセットするためのSQL

-- まず既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "プロフィールは誰でも参照できる" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールだけ更新できる" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールだけ削除できる" ON profiles;
DROP POLICY IF EXISTS "認証済みユーザーはプロフィールを作成できる" ON profiles;
DROP POLICY IF EXISTS "認証済みユーザーは自分のプロフィールを管理できる" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- トリガー関数を削除
DROP FUNCTION IF EXISTS public.create_profile_if_not_exists();

-- RLSを一時的に無効化して、すべてのアクセスを許可
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 英語のポリシー名を使用（日本語のポリシー名が問題を引き起こす可能性があるため）
-- 誰でもプロフィールを参照できる
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- ユーザーは自分のプロフィールを作成できる
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ユーザーは自分のプロフィールを更新できる
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- RLSを再度有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- プロフィールテーブルの構造を確認
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'profiles';

-- 既存のRLSポリシーを確認
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'profiles';

-- ユーザーのプロフィールが存在するか確認するヘルパー関数
CREATE OR REPLACE FUNCTION public.create_profile_if_not_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, updated_at)
  VALUES (NEW.id, NEW.email, NULL, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規ユーザー登録時にプロフィールを自動作成するトリガー
CREATE TRIGGER create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_if_not_exists();

-- 既存のユーザーにプロフィールがない場合は作成
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, email FROM auth.users
  LOOP
    INSERT INTO public.profiles (id, username, avatar_url, updated_at)
    VALUES (user_record.id, user_record.email, NULL, NOW())
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END
$$;
