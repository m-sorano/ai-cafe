-- knowledge_cards テーブルの作成
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

-- 認証済みユーザーに更新権限を付与（オプション）
CREATE POLICY "Authenticated users can update knowledge cards" 
ON public.knowledge_cards FOR UPDATE 
TO authenticated 
USING (true);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS knowledge_cards_source_post_id_idx ON public.knowledge_cards(source_post_id);
CREATE INDEX IF NOT EXISTS knowledge_cards_created_at_idx ON public.knowledge_cards(created_at);
