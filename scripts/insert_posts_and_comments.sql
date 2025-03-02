-- 生成AI相談室 アプリケーション用のサンプルデータ
-- 投稿17件とそれぞれの投稿に対するコメント1～3件を挿入

-- 既存のデータがある場合は削除（テスト環境用）
-- DELETE FROM public.comments;
-- DELETE FROM public.posts;
-- DELETE FROM public.profiles WHERE id IN (
--   '3d479505-e1a4-4a8b-9d19-7bc371eecefb',
--   '1a0f3690-587c-40d4-a525-018378d9bc10',
--   'd4c89c7a-5b1a-4099-b4b1-d5bb2fbe9d04',
--   '8937b118-da41-4155-96c9-8ceadcf72614',
--   'f68fb996-2944-4560-be64-9846ff62ac60'
-- );

-- まず、プロフィールデータを挿入（外部キー制約のため）
INSERT INTO public.profiles (id, name, avatar_url, bio, favorite_blend, created_at, updated_at)
VALUES
  ('3d479505-e1a4-4a8b-9d19-7bc371eecefb', '山田太郎', '/avatars/user1.png', 'AIに興味を持つエンジニア。特に自然言語処理に関心があります。', '初心者向けブレンド', NOW(), NOW()),
  ('1a0f3690-587c-40d4-a525-018378d9bc10', '佐藤花子', '/avatars/user2.png', 'デザイナー兼AIエンスージアスト。クリエイティブAIを日常的に活用しています。', 'クリエイティブブレンド', NOW(), NOW()),
  ('d4c89c7a-5b1a-4099-b4b1-d5bb2fbe9d04', '鈴木一郎', '/avatars/user3.png', 'IT企業でAI導入コンサルタントをしています。ビジネスにおけるAI活用が専門です。', 'ビジネスブレンド', NOW(), NOW()),
  ('8937b118-da41-4155-96c9-8ceadcf72614', '高橋研究員', '/avatars/user4.png', 'AI研究者。最新の深層学習モデルの研究開発に従事しています。', '上級者ブレンド', NOW(), NOW()),
  ('f68fb996-2944-4560-be64-9846ff62ac60', '田中メディア', '/avatars/user5.png', 'AIとメディアの融合に興味があるジャーナリスト。AIの社会的影響について考察しています。', 'フリートークブレンド', NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  favorite_blend = EXCLUDED.favorite_blend,
  updated_at = NOW();

-- 投稿の挿入
INSERT INTO public.posts (id, user_id, content, blend_type, created_at, updated_at)
VALUES
  -- 初心者向けブレンド
  (uuid_generate_v4(), '3d479505-e1a4-4a8b-9d19-7bc371eecefb', 'AIの基本概念について学び始めたばかりです。機械学習と深層学習の違いを教えていただけますか？初心者にもわかりやすく説明していただけると嬉しいです。', '初心者向けブレンド', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  (uuid_generate_v4(), '1a0f3690-587c-40d4-a525-018378d9bc10', 'ChatGPTを初めて使ってみましたが、驚くほど自然な会話ができますね！どのように学習しているのか興味があります。プロンプトエンジニアリングについても知りたいです。', '初心者向けブレンド', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  (uuid_generate_v4(), 'd4c89c7a-5b1a-4099-b4b1-d5bb2fbe9d04', 'AIを使った画像生成に興味があります。Stable DiffusionとMidjourneyの違いは何でしょうか？初心者でも使いやすいのはどちらですか？', '初心者向けブレンド', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  
  -- 上級者ブレンド
  (uuid_generate_v4(), '8937b118-da41-4155-96c9-8ceadcf72614', 'トランスフォーマーアーキテクチャの最新研究について議論しましょう。特に注目すべき論文はありますか？自己注意機構の改良に関する最近の進展が気になります。', '上級者ブレンド', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  (uuid_generate_v4(), 'f68fb996-2944-4560-be64-9846ff62ac60', 'LLMのファインチューニングで量子化手法を試しています。INT4量子化とQLoRAを組み合わせた結果、興味深い精度とパフォーマンスのトレードオフが見られました。皆さんの経験を共有していただけますか？', '上級者ブレンド', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  (uuid_generate_v4(), '3d479505-e1a4-4a8b-9d19-7bc371eecefb', '強化学習からのフィードバックを用いたLLMのアライメント手法について研究しています。RLHF以外の手法で有望なものはありますか？特にConstitutional AIアプローチに興味があります。', '上級者ブレンド', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  
  -- ビジネスブレンド
  (uuid_generate_v4(), '1a0f3690-587c-40d4-a525-018378d9bc10', '中小企業向けにAIチャットボットを導入する際のコスト対効果について議論したいです。導入事例や成功例、失敗例などあれば教えてください。', 'ビジネスブレンド', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
  (uuid_generate_v4(), 'd4c89c7a-5b1a-4099-b4b1-d5bb2fbe9d04', 'AIを活用した営業支援ツールを比較しています。特にリード獲得と顧客分析に強いソリューションを探しています。おすすめがあれば教えてください。', 'ビジネスブレンド', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  (uuid_generate_v4(), '8937b118-da41-4155-96c9-8ceadcf72614', '製造業におけるAI活用事例を集めています。特に予知保全と品質管理での成功例に興味があります。ROIを測定する方法についても知見があれば共有お願いします。', 'ビジネスブレンド', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  
  -- クリエイティブブレンド
  (uuid_generate_v4(), 'f68fb996-2944-4560-be64-9846ff62ac60', 'AIを使った音楽生成に挑戦しています。MusicLMとSoraを組み合わせて短い映像と音楽を作成しました。プロンプトエンジニアリングのコツを共有します。', 'クリエイティブブレンド', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  (uuid_generate_v4(), '3d479505-e1a4-4a8b-9d19-7bc371eecefb', 'AIアートを展示会に出展する際の著作権問題について議論したいです。特にトレーニングデータと生成物の権利関係について、最新の法的見解を知りたいです。', 'クリエイティブブレンド', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  (uuid_generate_v4(), '1a0f3690-587c-40d4-a525-018378d9bc10', 'AIを使った小説執筆支援ツールを比較しています。プロットの生成からキャラクター設定、文体の一貫性まで、どのツールが最も使いやすいでしょうか？', 'クリエイティブブレンド', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  
  -- フリートークブレンド
  (uuid_generate_v4(), 'd4c89c7a-5b1a-4099-b4b1-d5bb2fbe9d04', 'AIに関する最近の映画やドラマでおすすめはありますか？技術的に正確な描写をしている作品を探しています。', 'フリートークブレンド', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (uuid_generate_v4(), '8937b118-da41-4155-96c9-8ceadcf72614', 'AIと共存する未来について、皆さんはどう思いますか？楽観的な見方と懸念点、両方の視点から議論できればと思います。', 'フリートークブレンド', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  (uuid_generate_v4(), 'f68fb996-2944-4560-be64-9846ff62ac60', 'AIカフェで一番好きなブレンドは何ですか？私は最近クリエイティブブレンドにハマっています。皆さんのお気に入りを教えてください！', 'フリートークブレンド', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (uuid_generate_v4(), '3d479505-e1a4-4a8b-9d19-7bc371eecefb', 'AIに関する面白い都市伝説や誤解について話しましょう。「AIは人間の仕事を全て奪う」といった誤解をどう解消すべきでしょうか？', 'フリートークブレンド', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  (uuid_generate_v4(), '1a0f3690-587c-40d4-a525-018378d9bc10', 'AIを学ぶためのおすすめの書籍やオンラインコースを共有しましょう。初心者から上級者まで、レベル別にリストアップできると嬉しいです。', 'フリートークブレンド', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- 投稿IDを取得するための一時テーブル
CREATE TEMPORARY TABLE temp_post_ids AS
SELECT id FROM public.posts ORDER BY created_at;

-- コメントの挿入（各投稿に1〜3件のコメント）
DO $$
DECLARE
    post_record RECORD;
    comment_count INTEGER;
    user_ids uuid[] := ARRAY['3d479505-e1a4-4a8b-9d19-7bc371eecefb', '1a0f3690-587c-40d4-a525-018378d9bc10', 'd4c89c7a-5b1a-4099-b4b1-d5bb2fbe9d04', '8937b118-da41-4155-96c9-8ceadcf72614', 'f68fb996-2944-4560-be64-9846ff62ac60'];
    random_user_id uuid;
    random_interval INTERVAL;
BEGIN
    FOR post_record IN SELECT * FROM temp_post_ids LOOP
        -- 各投稿に対して1〜3件のコメントをランダムに生成
        comment_count := floor(random() * 3) + 1;
        
        FOR i IN 1..comment_count LOOP
            -- ランダムなユーザーIDを選択（投稿者以外）
            random_user_id := user_ids[floor(random() * 5) + 1];
            -- ランダムな時間間隔（6時間〜2日）
            random_interval := (floor(random() * 42) + 6) * INTERVAL '1 hour';
            
            -- コメントの内容をコメント番号に基づいて変更
            CASE i
                WHEN 1 THEN
                    INSERT INTO public.comments (id, post_id, user_id, content, created_at, updated_at)
                    VALUES (
                        uuid_generate_v4(),
                        post_record.id,
                        random_user_id,
                        '素晴らしい投稿をありがとうございます！とても参考になりました。この分野についてもっと深く知りたくなりました。',
                        (SELECT created_at FROM public.posts WHERE id = post_record.id) + random_interval,
                        (SELECT created_at FROM public.posts WHERE id = post_record.id) + random_interval
                    );
                WHEN 2 THEN
                    INSERT INTO public.comments (id, post_id, user_id, content, created_at, updated_at)
                    VALUES (
                        uuid_generate_v4(),
                        post_record.id,
                        random_user_id,
                        '興味深い視点ですね。私も似たような経験があります。この話題について、最近読んだ記事では別の角度からのアプローチも紹介されていました。',
                        (SELECT created_at FROM public.posts WHERE id = post_record.id) + random_interval + INTERVAL '3 hours',
                        (SELECT created_at FROM public.posts WHERE id = post_record.id) + random_interval + INTERVAL '3 hours'
                    );
                WHEN 3 THEN
                    INSERT INTO public.comments (id, post_id, user_id, content, created_at, updated_at)
                    VALUES (
                        uuid_generate_v4(),
                        post_record.id,
                        random_user_id,
                        'この内容について、もう少し詳しく教えていただけませんか？特に実践的な応用例があれば知りたいです。',
                        (SELECT created_at FROM public.posts WHERE id = post_record.id) + random_interval + INTERVAL '6 hours',
                        (SELECT created_at FROM public.posts WHERE id = post_record.id) + random_interval + INTERVAL '6 hours'
                    );
            END CASE;
        END LOOP;
    END LOOP;
END $$;

-- 一時テーブルの削除
DROP TABLE temp_post_ids;

-- 確認用クエリ
-- SELECT COUNT(*) FROM public.posts;
-- SELECT COUNT(*) FROM public.comments;
-- SELECT p.content, COUNT(c.id) AS comment_count FROM public.posts p LEFT JOIN public.comments c ON p.id = c.post_id GROUP BY p.content ORDER BY p.created_at;
