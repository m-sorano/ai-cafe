-- profilesテーブルのRLSポリシーを修正するためのSQL（より緩和されたバージョン）

-- まず既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "プロフィールは誰でも参照できる" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールだけ更新できる" ON profiles;
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールだけ削除できる" ON profiles;
DROP POLICY IF EXISTS "認証済みユーザーはプロフィールを作成できる" ON profiles;
DROP POLICY IF EXISTS "認証済みユーザーは自分のプロフィールを管理できる" ON profiles;

-- RLSが有効になっているか確認
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 新しいポリシー：より緩和されたアプローチ

-- 誰でもプロフィールを参照できる
CREATE POLICY "プロフィールは誰でも参照できる"
ON profiles FOR SELECT
USING (true);

-- 認証済みユーザーは自分のプロフィールを管理できる（すべての操作）
CREATE POLICY "認証済みユーザーは自分のプロフィールを管理できる"
ON profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

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

-- トリガーが既に存在する場合は削除
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

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

-- プロフィールテーブルの内容を確認
SELECT * FROM profiles;
