import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 本番環境では必ず認証とアクセス制限を行うこと
  // これはデモ用の簡易実装です
  
  try {
    const { sql } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }
    
    // SQLを直接実行
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in execute-sql API:', error);
    return res.status(500).json({ error: error.message });
  }
}
