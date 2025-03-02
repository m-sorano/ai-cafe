-- avatarsバケットのRLSポリシーを修正するためのSQL（完全に緩和されたバージョン）

-- まず既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "誰でもアバター画像を参照できる" ON storage.objects;
DROP POLICY IF EXISTS "認証済みユーザーはアバター画像をアップロードできる" ON storage.objects;
DROP POLICY IF EXISTS "ユーザーは自分のアバター画像を更新できる" ON storage.objects;
DROP POLICY IF EXISTS "ユーザーは自分のアバター画像を削除できる" ON storage.objects;
DROP POLICY IF EXISTS "認証済みユーザーはavatarsバケットにアクセスできる" ON storage.objects;
DROP POLICY IF EXISTS "全てのユーザーがavatarsバケットにアクセスできる" ON storage.objects;

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

-- 重要: storage.objectsテーブルのRLSを有効化
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 最も緩和されたポリシー：誰でもavatarsバケットに対してすべての操作が可能
CREATE POLICY "全てのユーザーがavatarsバケットにアクセスできる"
ON storage.objects
FOR ALL
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

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

-- テスト用のダミーファイルを作成（必要に応じて）
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES ('avatars', 'test.txt', auth.uid(), '{"mimetype": "text/plain", "size": 0}')
ON CONFLICT (bucket_id, name) DO NOTHING;

-- バケットのオブジェクト所有者を設定するためのトリガー関数
CREATE OR REPLACE FUNCTION storage.set_object_owner()
RETURNS TRIGGER AS $$
BEGIN
    NEW.owner = auth.uid();
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- トリガーが既に存在する場合は削除
DROP TRIGGER IF EXISTS set_object_owner_trigger ON storage.objects;

-- 新しいオブジェクトが挿入されるときに所有者を設定するトリガーを作成
CREATE TRIGGER set_object_owner_trigger
BEFORE INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION storage.set_object_owner();

-- 既存のオブジェクトの所有者を更新（必要に応じて）
-- 注意: 既存のファイルがある場合のみ実行してください
-- UPDATE storage.objects SET owner = auth.uid() WHERE bucket_id = 'avatars' AND owner IS NULL;
