import { supabase, supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { postId, title, content, tags } = req.body;

    if (!postId) {
      return res.status(400).json({ error: '投稿IDが必要です' });
    }

    // 投稿の存在確認
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, content')
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
      return res.status(500).json({ error: postError.message });
    }

    if (!post) {
      return res.status(404).json({ error: '投稿が見つかりませんでした' });
    }

    // 知識カードの作成
    const cardTitle = title || `${post.content.substring(0, 30)}...に関する豆知識`;
    const cardContent = content || post.content;
    const cardTags = tags || ['AI生成', 'コーヒー'];

    // サービスロールクライアントがあれば使用し、なければ通常のクライアントを使用
    const client = supabaseAdmin || supabase;
    console.log('Using service role client:', !!supabaseAdmin);

    const { data, error } = await client
      .from('knowledge_cards')
      .insert([{
        title: cardTitle,
        content: cardContent,
        tags: cardTags,
        source_post_id: postId
      }])
      .select();

    if (error) {
      console.error('Error creating knowledge card:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error in create-knowledge-card API:', error);
    return res.status(500).json({ error: error.message });
  }
}
