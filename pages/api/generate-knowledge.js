import { generateKnowledgeCardContent } from '../../lib/gemini';
import { supabase, supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: '投稿IDが必要です' });
    }

    // 投稿の内容を取得
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

    // Gemini APIを使用して知識カードの内容を生成
    const cardData = await generateKnowledgeCardContent(post.content);
    console.log('Generated knowledge card data:', cardData);

    // サービスロールクライアントがあれば使用し、なければ通常のクライアントを使用
    const client = supabaseAdmin || supabase;
    console.log('Using service role client:', !!supabaseAdmin);

    // 知識カードをデータベースに保存
    const { data, error } = await client
      .from('knowledge_cards')
      .insert([{
        title: cardData.title,
        content: cardData.content,
        tags: cardData.tags,
        source_post_id: postId
      }])
      .select();

    if (error) {
      console.error('Error creating knowledge card:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Error in generate-knowledge API:', error);
    return res.status(500).json({ error: error.message });
  }
}
