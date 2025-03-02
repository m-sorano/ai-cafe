# Supabase 外部キー関係の修正手順

このドキュメントでは、生成AI相談室アプリケーションで発生している外部キー関係のエラーを修正する手順を説明します。

## エラーの内容

### 外部キー関係のエラー

```json
{
    "code": "PGRST200",
    "details": "Searched for a foreign key relationship between 'posts' and 'user_id' in the schema 'public', but no matches were found.",
    "hint": null,
    "message": "Could not find a relationship between 'posts' and 'user_id' in the schema cache"
}
```

このエラーは、Supabaseのデータベースで`posts`テーブルと`user_id`カラムの間に正しい外部キー関係が設定されていないことを示しています。

### Row Level Security (RLS)ポリシーのエラー

```json
{
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "new row violates row-level security policy for table \"posts\""
}
```

このエラーは、RLSポリシーによって新しい行の挿入が拒否されたことを示しています。

## 修正手順

### 1. 外部キー関係の修正

1. Supabaseのダッシュボードにログインします。
2. プロジェクトを選択します。
3. 左側のメニューから「SQL Editor」を選択します。
4. 新しいクエリを作成し、`fix-foreign-keys.sql`ファイルの内容をコピー＆ペーストします。
5. 「Run」ボタンをクリックしてSQLを実行します。

### 2. RLSポリシーの修正

以下のSQLを実行して、RLSポリシーを修正します：

```sql
-- postsテーブルのRLSを有効化（すでに有効になっている場合は不要）
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（必要に応じて）
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON posts;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON posts;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;

-- 新しいポリシーを作成
-- 認証済みユーザーのみ投稿を作成可能
CREATE POLICY "Enable insert for authenticated users only" 
ON posts FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 自分の投稿のみ更新可能
CREATE POLICY "Enable update for users based on user_id" 
ON posts FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- 自分の投稿のみ削除可能
CREATE POLICY "Enable delete for users based on user_id" 
ON posts FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- すべてのユーザーが投稿を閲覧可能
CREATE POLICY "Enable read access for all users" 
ON posts FOR SELECT 
TO anon, authenticated 
USING (true);
```

## 修正内容の説明

### 外部キー修正

このSQLスクリプトは以下の修正を行います：

1. 既存の外部キー制約を削除します（存在する場合）
2. 明示的な名前を持つ適切な外部キー制約を追加します
   - `posts_user_id_fkey`
   - `comments_user_id_fkey`
   - `reactions_user_id_fkey`
3. 新しいユーザーが登録されたときに自動的にプロフィールを作成するトリガーを設定します
4. Supabaseのスキーマキャッシュをリロードして、新しい関係を認識させます

### RLSポリシー修正

RLSポリシーの修正では：

1. 認証済みユーザーのみが投稿を作成できるようにします
2. ユーザーは自分の投稿のみを更新・削除できるようにします
3. すべてのユーザーが投稿を閲覧できるようにします
4. `auth.uid()`関数を使用して、現在のユーザーIDを取得します

## 確認方法

修正が正常に適用されたことを確認するには：

1. アプリケーションで新しいユーザーを登録してみてください
2. 正常に登録できれば、修正は成功しています
3. Supabaseダッシュボードの「Table Editor」で各テーブルを確認し、外部キー関係が正しく表示されていることを確認できます
4. 投稿の作成、更新、削除が正常に行えることを確認してください

## コードの修正

すでにアプリケーションコードは修正済みですが、以下の点を確認してください：

1. Supabaseのクエリで正しい外部キー参照を使用していること
   - 例: `profiles!posts_user_id_fkey` または `profiles:user_id`
2. オプショナルチェーン（`?.`）を使用して、存在しない可能性のあるプロパティへのアクセスを安全に行っていること
3. 投稿作成時に、正しいユーザーIDが設定されていること
   - 例: `user_id: supabase.auth.getUser().id`

これらの修正により、ユーザー登録時のデータベースエラーが解決され、アプリケーション全体のデータ関係が正しく機能するようになります。

## 画像表示の修正

知識カードの画像が表示されない問題については、以下の修正を行いました：

1. `knowledge/index.js`と`knowledge/[id].js`に`Image`コンポーネントをインポート
2. 画像URLが存在する場合に表示するコードを追加
3. 画像読み込みエラー時のフォールバック処理を追加

これにより、知識カードの画像が正しく表示されるようになります。
