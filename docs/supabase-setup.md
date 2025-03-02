# Supabase セットアップガイド

このドキュメントでは、生成AI相談室アプリケーションで使用するSupabaseの設定方法について説明します。

## 1. Supabaseアカウントの作成

1. [Supabase](https://supabase.com/)にアクセスし、アカウントを作成またはログインします。
2. 新しいプロジェクトを作成します。

## 2. データベーステーブルの作成

以下のテーブルを作成します：

### users テーブル
Supabaseの認証機能で自動的に作成されます。

### profiles テーブル
```sql
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null
);

-- RLSポリシーの設定
alter table profiles enable row level security;

create policy "ユーザーは自分のプロフィールを参照できる" 
  on profiles for select 
  using ( auth.uid() = id );

create policy "ユーザーは自分のプロフィールを更新できる" 
  on profiles for update 
  using ( auth.uid() = id );
```

### posts テーブル
```sql
create table posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  blend_type text not null,
  created_at timestamp with time zone default now() not null
);

-- RLSポリシーの設定
alter table posts enable row level security;

create policy "誰でも投稿を参照できる" 
  on posts for select 
  using ( true );

create policy "認証済みユーザーは投稿を作成できる" 
  on posts for insert 
  using ( auth.role() = 'authenticated' );

create policy "ユーザーは自分の投稿を更新できる" 
  on posts for update 
  using ( auth.uid() = user_id );

create policy "ユーザーは自分の投稿を削除できる" 
  on posts for delete 
  using ( auth.uid() = user_id );
```

### comments テーブル
```sql
create table comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts on delete cascade not null,
  user_id uuid references auth.users not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

-- RLSポリシーの設定
alter table comments enable row level security;

create policy "誰でもコメントを参照できる" 
  on comments for select 
  using ( true );

create policy "認証済みユーザーはコメントを作成できる" 
  on comments for insert 
  using ( auth.role() = 'authenticated' );

create policy "ユーザーは自分のコメントを更新できる" 
  on comments for update 
  using ( auth.uid() = user_id );

create policy "ユーザーは自分のコメントを削除できる" 
  on comments for delete 
  using ( auth.uid() = user_id );
```

### reactions テーブル
```sql
create table reactions (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts on delete cascade not null,
  user_id uuid references auth.users not null,
  type text not null,
  created_at timestamp with time zone default now() not null,
  unique(post_id, user_id)
);

-- RLSポリシーの設定
alter table reactions enable row level security;

create policy "誰でもリアクションを参照できる" 
  on reactions for select 
  using ( true );

create policy "認証済みユーザーはリアクションを作成できる" 
  on reactions for insert 
  using ( auth.role() = 'authenticated' );

create policy "ユーザーは自分のリアクションを更新できる" 
  on reactions for update 
  using ( auth.uid() = user_id );

create policy "ユーザーは自分のリアクションを削除できる" 
  on reactions for delete 
  using ( auth.uid() = user_id );
```

### knowledge_cards テーブル
```sql
create table knowledge_cards (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  tags text[] not null,
  source_post_id uuid references posts,
  created_at timestamp with time zone default now() not null
);

-- RLSポリシーの設定
alter table knowledge_cards enable row level security;

create policy "誰でも知識カードを参照できる" 
  on knowledge_cards for select 
  using ( true );

create policy "認証済みユーザーは知識カードを作成できる" 
  on knowledge_cards for insert 
  using ( auth.role() = 'authenticated' );
```

## 3. 環境変数の設定

1. Supabaseのプロジェクトダッシュボードに移動します。
2. 左側のメニューから「Settings」→「API」を選択します。
3. 「Project URL」と「anon」「public」の下に表示されるキーをコピーします。
4. プロジェクトのルートディレクトリに`.env.local`ファイルを作成し、以下の内容を追加します：

```
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase匿名キー
```

## 4. Supabase認証の設定

1. Supabaseのプロジェクトダッシュボードに移動します。
2. 左側のメニューから「Authentication」→「Settings」を選択します。
3. 「Site URL」にあなたのアプリケーションのURLを設定します（開発環境では `http://localhost:3000` など）。
4. 「Redirect URLs」に認証後のリダイレクト先URLを追加します（例: `http://localhost:3000/auth/callback`）。
5. 必要に応じて、Email、Google、GitHubなどの認証プロバイダーを設定します。

## 5. ストレージバケットの設定（オプション）

プロフィール画像やその他のファイルをアップロードする場合：

1. 左側のメニューから「Storage」を選択します。
2. 「Create bucket」をクリックし、「avatars」という名前のバケットを作成します。
3. 適切なRLSポリシーを設定します：

```sql
-- avatarsバケットのポリシー
create policy "誰でもアバター画像を参照できる"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "認証済みユーザーは自分のアバター画像をアップロードできる"
  on storage.objects for insert
  using ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

create policy "ユーザーは自分のアバター画像を更新できる"
  on storage.objects for update
  using ( bucket_id = 'avatars' AND auth.uid() = owner );

create policy "ユーザーは自分のアバター画像を削除できる"
  on storage.objects for delete
  using ( bucket_id = 'avatars' AND auth.uid() = owner );
```

## トラブルシューティング

- **認証エラー**: 環境変数が正しく設定されているか確認してください。
- **RLSエラー**: Row Level Security (RLS) ポリシーが正しく設定されているか確認してください。
- **CORSエラー**: Supabaseの「Settings」→「API」→「CORS」で、あなたのアプリケーションのURLが許可されているか確認してください。
