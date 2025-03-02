import { supabase } from '../../lib/supabase';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  // サーバーサイド Supabase クライアントを作成
  const supabaseServerClient = createServerSupabaseClient({ req, res });
  
  // ユーザーセッションを取得
  const { data: { session }, error: sessionError } = await supabaseServerClient.auth.getSession();
  
  if (sessionError || !session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const user = session.user;
  
  // GETリクエストの場合はプロフィールを取得
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseServerClient
        .from('profiles')
        .select('id, name, avatar_url, bio, website, email, created_at')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // POSTリクエストの場合はプロフィールを更新
  if (req.method === 'POST') {
    try {
      const { name, avatar_url, bio, website } = req.body;
      
      // サーバーサイドクライアントを使用して更新
      const { data, error } = await supabaseServerClient
        .from('profiles')
        .upsert({
          id: user.id,
          name,
          avatar_url,
          bio,
          website
        }, {
          returning: 'minimal'
        });
        
      if (error) throw error;
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  // その他のメソッドは許可しない
  return res.status(405).json({ error: 'Method not allowed' });
}
