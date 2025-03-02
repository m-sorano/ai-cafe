import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';

const AdminSetup = () => {
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isFixingRLS, setIsFixingRLS] = useState(false);
  const [isCreatingKnowledgeTable, setIsCreatingKnowledgeTable] = useState(false);
  const [isFixingKnowledgeRLS, setIsFixingKnowledgeRLS] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [sqlResult, setSqlResult] = useState(null);
  const [sqlError, setSqlError] = useState(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  const handleSetupDB = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/setup-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'データベースのセットアップに失敗しました');
      }

      setResult(data.message);
    } catch (error) {
      console.error('Error setting up database:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixProfilesRLS = async () => {
    setIsFixingRLS(true);
    setResult(null);
    setError(null);

    const sql = `
      -- RLSを一時的に無効化
      ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

      -- 既存のポリシーを削除
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Service role has full access to profiles" ON public.profiles;

      -- RLSを再度有効化
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

      -- 全ユーザーに読み取り権限を付与
      CREATE POLICY "Public profiles are viewable by everyone" 
      ON public.profiles FOR SELECT 
      USING (true);

      -- 認証済みユーザーに自分のプロフィールの挿入権限を付与
      CREATE POLICY "Users can insert their own profile" 
      ON public.profiles FOR INSERT 
      TO authenticated 
      WITH CHECK (auth.uid() = id);

      -- 認証済みユーザーに自分のプロフィールの更新権限を付与
      CREATE POLICY "Users can update own profile" 
      ON public.profiles FOR UPDATE 
      TO authenticated 
      USING (auth.uid() = id);

      -- サービスロールにすべての権限を付与
      CREATE POLICY "Service role has full access to profiles" 
      ON public.profiles
      TO service_role
      USING (true)
      WITH CHECK (true);

      -- updated_at カラムを追加（存在しない場合）
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'profiles'
              AND column_name = 'updated_at'
          ) THEN
              ALTER TABLE public.profiles
              ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
          END IF;
      END $$;
    `;

    try {
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'SQLの実行に失敗しました');
      }

      setResult('プロフィールテーブルのRLSポリシーが正常に修正されました');
    } catch (error) {
      console.error('Error executing SQL:', error);
      setError(error.message);
    } finally {
      setIsFixingRLS(false);
    }
  };

  const handleCreateKnowledgeCardsTable = async () => {
    setIsCreatingKnowledgeTable(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `
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
            DROP POLICY IF EXISTS "Knowledge cards are viewable by everyone" ON public.knowledge_cards;
            CREATE POLICY "Knowledge cards are viewable by everyone" 
            ON public.knowledge_cards FOR SELECT 
            USING (true);
            
            -- 認証済みユーザーに挿入権限を付与
            DROP POLICY IF EXISTS "Authenticated users can insert knowledge cards" ON public.knowledge_cards;
            CREATE POLICY "Authenticated users can insert knowledge cards" 
            ON public.knowledge_cards FOR INSERT 
            TO authenticated 
            WITH CHECK (true);
            
            -- 認証済みユーザーに更新権限を付与
            DROP POLICY IF EXISTS "Authenticated users can update knowledge cards" ON public.knowledge_cards;
            CREATE POLICY "Authenticated users can update knowledge cards" 
            ON public.knowledge_cards FOR UPDATE 
            TO authenticated 
            USING (true);
            
            -- インデックスの作成
            CREATE INDEX IF NOT EXISTS knowledge_cards_source_post_id_idx ON public.knowledge_cards(source_post_id);
            CREATE INDEX IF NOT EXISTS knowledge_cards_created_at_idx ON public.knowledge_cards(created_at);
          `
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '知識カードテーブルの作成に失敗しました');
      }

      setResult('知識カードテーブルが正常に作成されました');
    } catch (error) {
      console.error('Error creating knowledge cards table:', error);
      setError(error.message);
    } finally {
      setIsCreatingKnowledgeTable(false);
    }
  };

  const handleFixKnowledgeCardsRLS = async () => {
    setIsFixingKnowledgeRLS(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `
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
          `
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '知識カードテーブルのRLSポリシー修正に失敗しました');
      }

      setResult('知識カードテーブルのRLSポリシーが正常に修正されました');
    } catch (error) {
      console.error('Error fixing knowledge cards RLS:', error);
      setError(error.message);
    } finally {
      setIsFixingKnowledgeRLS(false);
    }
  };

  const executeSql = async (e) => {
    e.preventDefault();
    setSqlLoading(true);
    setSqlResult(null);
    setSqlError(null);

    try {
      const response = await fetch('/api/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: sqlQuery }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'SQLの実行に失敗しました');
      }

      setSqlResult('SQLが正常に実行されました');
    } catch (error) {
      console.error('Error executing SQL:', error);
      setSqlError(error.message);
    } finally {
      setSqlLoading(false);
    }
  };

  // ログインしていない場合のみアクセス制限
  if (!user) {
    return (
      <Layout>
        <div className="cafe-container py-12">
          <div className="cafe-card bg-cream text-center">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">アクセス権限がありません</h2>
            <p className="text-coffee-medium mb-6">
              このページはログインユーザー専用です。ログインしてください。
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="cafe-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-coffee-dark mb-4">
            データベース管理
          </h1>
          <p className="text-coffee-medium max-w-2xl mx-auto">
            データベースのセットアップや管理を行います。
          </p>
        </motion.div>

        <div className="cafe-card bg-cream mb-6">
          <h2 className="text-xl font-bold text-coffee-dark mb-4">データベース管理</h2>
          
          <div className="space-y-4">
            <div>
              <button 
                onClick={handleSetupDB}
                disabled={isLoading}
                className="cafe-button w-full"
              >
                {isLoading ? 'セットアップ中...' : 'データベースをセットアップ'}
              </button>
              <p className="mt-2 text-sm text-coffee-medium">
                必要なテーブルとカラムを作成します。
              </p>
            </div>
            
            <div>
              <button 
                onClick={handleFixProfilesRLS}
                disabled={isFixingRLS}
                className="cafe-button w-full"
              >
                {isFixingRLS ? '修正中...' : 'プロフィールRLSを修正'}
              </button>
              <p className="mt-2 text-sm text-coffee-medium">
                プロフィールテーブルのRow Level Securityポリシーを修正します。
              </p>
            </div>

            <div>
              <button 
                onClick={handleCreateKnowledgeCardsTable}
                disabled={isCreatingKnowledgeTable}
                className="cafe-button w-full"
              >
                {isCreatingKnowledgeTable ? '作成中...' : '知識カードテーブルを作成'}
              </button>
              <p className="mt-2 text-sm text-coffee-medium">
                知識カードテーブルを作成し、必要なRLSポリシーを設定します。
              </p>
            </div>

            <div>
              <button 
                onClick={handleFixKnowledgeCardsRLS}
                disabled={isFixingKnowledgeRLS}
                className="cafe-button w-full"
              >
                {isFixingKnowledgeRLS ? '修正中...' : '知識カードRLSを修正'}
              </button>
              <p className="mt-2 text-sm text-coffee-medium">
                知識カードテーブルのRow Level Securityポリシーを修正します。
              </p>
            </div>

            <div>
              <a 
                href="/admin/create-test-card"
                className="cafe-button w-full block text-center"
              >
                テスト用知識カードを作成
              </a>
              <p className="mt-2 text-sm text-coffee-medium">
                テスト用の知識カードを手動で作成します。
              </p>
            </div>
          </div>
        </div>

        <div className="cafe-card bg-cream">
          <h2 className="text-xl font-bold text-coffee-dark mb-4">
            SQLを直接実行
          </h2>
          <p className="text-coffee-medium mb-6">
            SQLクエリを直接実行します。注意: このツールは開発環境でのみ使用してください。
          </p>

          <form onSubmit={executeSql} className="space-y-4">
            <div>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="実行するSQLクエリを入力..."
                className="cafe-input min-h-[200px] font-mono"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sqlLoading || !sqlQuery.trim()}
                className="cafe-button"
              >
                {sqlLoading ? '実行中...' : 'SQLを実行'}
              </button>
            </div>
          </form>

          {sqlResult && (
            <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-lg">
              <p>{sqlResult}</p>
            </div>
          )}

          {sqlError && (
            <div className="mt-6 p-4 bg-red-100 text-red-800 rounded-lg">
              <p>{sqlError}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminSetup;
