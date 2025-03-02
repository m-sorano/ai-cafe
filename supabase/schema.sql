-- 生成AI相談室 アプリケーション用のデータベーススキーマ

-- profiles テーブル: ユーザープロフィール情報を格納
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  favorite_blend TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLSポリシーの設定
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ユーザープロフィールは誰でも参照可能"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "ユーザーは自分のプロフィールを更新可能"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "ユーザーは自分のプロフィールを作成可能"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- posts テーブル: 投稿内容を格納
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  blend_type TEXT NOT NULL, -- 初心者向け、上級者向け、ビジネス向けなど
  title TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLSポリシーの設定
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "投稿は誰でも参照可能"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "認証済みユーザーは投稿を作成可能"
  ON public.posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ユーザーは自分の投稿を更新可能"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分の投稿を削除可能"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- comments テーブル: 投稿へのコメントを格納
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLSポリシーの設定
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "コメントは誰でも参照可能"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "認証済みユーザーはコメントを作成可能"
  ON public.comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ユーザーは自分のコメントを更新可能"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のコメントを削除可能"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- reactions テーブル: 投稿へのリアクション（ラテアート）を格納
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL, -- ハート型ラテアート、リーフ型ラテアートなど
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id) -- 1ユーザーにつき1投稿に1リアクションのみ
);

-- RLSポリシーの設定
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "リアクションは誰でも参照可能"
  ON public.reactions FOR SELECT
  USING (true);

CREATE POLICY "認証済みユーザーはリアクションを作成可能"
  ON public.reactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ユーザーは自分のリアクションを更新可能"
  ON public.reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のリアクションを削除可能"
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);

-- knowledge_cards テーブル: AI豆知識カードを格納
CREATE TABLE IF NOT EXISTS public.knowledge_cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL,
  source_post_id UUID REFERENCES public.posts,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLSポリシーの設定
ALTER TABLE public.knowledge_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "知識カードは誰でも参照可能"
  ON public.knowledge_cards FOR SELECT
  USING (true);

CREATE POLICY "認証済みユーザーは知識カードを作成可能"
  ON public.knowledge_cards FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- blends テーブル: 投稿カテゴリ（ブレンド）のマスターデータ
CREATE TABLE IF NOT EXISTS public.blends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLSポリシーの設定
ALTER TABLE public.blends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ブレンド情報は誰でも参照可能"
  ON public.blends FOR SELECT
  USING (true);

-- ブレンドの初期データを挿入
INSERT INTO public.blends (name, description, icon_url)
VALUES
  ('初心者向けブレンド', 'AIに初めて触れる方向けの、やさしい味わいのブレンドです。基本的な概念や入門知識を共有しましょう。', '/images/blends/beginner.png'),
  ('上級者ブレンド', '深い知識と経験を持つ方向けの、コクのある味わい深いブレンドです。高度な技術や最新研究について議論しましょう。', '/images/blends/advanced.png'),
  ('ビジネスブレンド', 'AIをビジネスに活用したい方向けの、バランスの取れたブレンドです。実用的なユースケースや導入事例を共有しましょう。', '/images/blends/business.png'),
  ('クリエイティブブレンド', 'AIを創作活動に活用したい方向けの、個性的な風味のブレンドです。アート、音楽、文学などでのAI活用法を探りましょう。', '/images/blends/creative.png'),
  ('フリートークブレンド', 'カテゴリにとらわれない自由な会話のためのカフェインレスブレンドです。AIに関する雑談や質問を気軽に投稿しましょう。', '/images/blends/free.png');

-- latte_art_types テーブル: リアクションで使用するラテアートの種類
CREATE TABLE IF NOT EXISTS public.latte_art_types (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- RLSポリシーの設定
ALTER TABLE public.latte_art_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ラテアート情報は誰でも参照可能"
  ON public.latte_art_types FOR SELECT
  USING (true);

-- ラテアートタイプの初期データを挿入
INSERT INTO public.latte_art_types (name, description, icon_url)
VALUES
  ('ハート', '投稿が気に入った時に使うシンプルで定番のラテアート', '/images/latte-art/heart.png'),
  ('リーフ', '新鮮な視点や知識に対して使う、葉っぱ型のラテアート', '/images/latte-art/leaf.png'),
  ('ロゼッタ', '洗練された考えや美しい説明に対して使う、複雑な花模様のラテアート', '/images/latte-art/rosetta.png'),
  ('スワン', '優雅で独創的なアイデアに対して使う、白鳥型のラテアート', '/images/latte-art/swan.png'),
  ('スマイル', '楽しい投稿や前向きな内容に対して使う、笑顔のラテアート', '/images/latte-art/smile.png');

-- トリガー: プロフィール更新時に updated_at を更新
CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_updated_at();

-- トリガー: 投稿更新時に updated_at を更新
CREATE OR REPLACE FUNCTION public.update_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_post_updated_at();

-- トリガー: コメント更新時に updated_at を更新
CREATE OR REPLACE FUNCTION public.update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_comment_updated_at();

-- トリガー: 知識カード更新時に updated_at を更新
CREATE OR REPLACE FUNCTION public.update_knowledge_card_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_knowledge_cards_updated_at
BEFORE UPDATE ON public.knowledge_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_knowledge_card_updated_at();

-- トリガー: 新規ユーザー登録時にプロフィールを自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
