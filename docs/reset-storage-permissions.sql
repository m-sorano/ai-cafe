-- Supabaseのストレージ設定を完全にリセットするためのSQL

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "誰でもアバター画像を参照できる" ON storage.objects;
DROP POLICY IF EXISTS "認証済みユーザーはアバター画像をアップロードできる" ON storage.objects;
DROP POLICY IF EXISTS "ユーザーは自分のアバター画像を更新できる" ON storage.objects;
DROP POLICY IF EXISTS "ユーザーは自分のアバター画像を削除できる" ON storage.objects;
DROP POLICY IF EXISTS "認証済みユーザーはavatarsバケットにアクセスできる" ON storage.objects;
DROP POLICY IF EXISTS "全てのユーザーがavatarsバケットにアクセスできる" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;

-- 既存のトリガーを削除
DROP TRIGGER IF EXISTS set_object_owner_trigger ON storage.objects;

-- トリガー関数を削除
DROP FUNCTION IF EXISTS storage.set_object_owner();

-- バケットが存在するか確認し、存在しない場合は作成
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'avatars'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
    END IF;
END $$;

-- avatarsバケットを公開に設定
UPDATE storage.buckets
SET public = true
WHERE name = 'avatars';

-- RLSを一時的に無効化して、すべてのアクセスを許可
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 英語のポリシー名を使用（日本語のポリシー名が問題を引き起こす可能性があるため）
-- 誰でもアバター画像を参照できる
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 誰でもアバター画像をアップロードできる
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- RLSを再度有効化
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- バケットの設定を確認
SELECT name, public FROM storage.buckets WHERE name = 'avatars';

-- RLSポリシーを確認
SELECT
  policyname,
  tablename,
  permissive,
  roles,
  cmd,
  qual
FROM
  pg_policies
WHERE
  tablename = 'objects' AND
  schemaname = 'storage';
