-- knowledge_cards テーブルのRLSポリシーを修正

-- RLSを一時的に無効化
ALTER TABLE public.knowledge_cards DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Knowledge cards are viewable by everyone" ON public.knowledge_cards;
DROP POLICY IF EXISTS "Authenticated users can insert knowledge cards" ON public.knowledge_cards;
DROP POLICY IF EXISTS "Authenticated users can update knowledge cards" ON public.knowledge_cards;
DROP POLICY IF EXISTS "Service role has full access to knowledge cards" ON public.knowledge_cards;

-- RLSを再度有効化
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

-- 認証済みユーザーに更新権限を付与
CREATE POLICY "Authenticated users can update knowledge cards" 
ON public.knowledge_cards FOR UPDATE 
TO authenticated 
USING (true);

-- サービスロールにすべての権限を付与
CREATE POLICY "Service role has full access to knowledge cards" 
ON public.knowledge_cards
USING (true)
WITH CHECK (true);
