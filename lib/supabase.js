import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 開発環境でのデバッグ用
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase URLまたは匿名キーが設定されていません。' +
    '.env.localファイルを作成し、NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを設定してください。'
  )
}

// 通常のクライアント（匿名キーを使用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// サービスロールを使用するクライアント（サーバーサイドでのみ使用）
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'x-supabase-key': supabaseServiceKey,
        },
      },
    })
  : null

// 投稿を取得する関数
export async function getPosts(category = null) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, name, avatar_url),
      comments:id (
        *,
        profiles:user_id (id, name, avatar_url)
      ),
      reactions:id (
        *,
        profiles:user_id (id, name, avatar_url)
      )
    `)
    .order('created_at', { ascending: false })
  
  // カテゴリーでフィルタリング
  if (category && category !== 'すべて') {
    query = query.eq('category', category)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching posts:', error)
    throw error
  }
  
  return data
}

// 投稿を作成する関数
export async function createPost(userId, content, categoryUuid) {
  const { data, error } = await supabase
    .from('posts')
    .insert([
      { 
        user_id: userId, 
        content, 
        category: categoryUuid 
      }
    ])
    .select()
  
  if (error) {
    console.error('Error creating post:', error)
    throw error
  }
  
  return data[0]
}

// ユーザープロフィールを取得する関数
export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, avatar_url, bio, website, created_at')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching profile:', error)
      // プロフィールが見つからない場合はデフォルト値を返す
      return {
        id: userId,
        name: null,
        avatar_url: '/images/default-avatar.png',
        bio: null,
        website: null
      }
    }
    
    // プロフィールが見つかった場合はそのまま返す
    // avatar_urlがnullの場合はデフォルト値を設定
    return {
      ...data,
      avatar_url: data.avatar_url || '/images/default-avatar.png'
    }
  } catch (error) {
    console.error('Error in getProfile:', error)
    // エラー時はデフォルト値を返す
    return {
      id: userId,
      name: null,
      avatar_url: '/images/default-avatar.png',
      bio: null,
      website: null
    }
  }
}

// ユーザープロフィールを更新する関数
export async function updateProfile({ id, name, avatar_url, bio, website }) {
  try {
    const updates = {
      id,
      name,
      avatar_url,
      bio,
      website,
      updated_at: new Date().toISOString(),
    };

    // サービスロールクライアントがあれば使用し、なければ通常のクライアントを使用
    const client = supabaseAdmin || supabase;
    
    const { error } = await client.from('profiles').upsert(updates, {
      returning: 'minimal',
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { error: error.message };
  }
}

// 知識カードを取得する関数
export async function getKnowledgeCards() {
  const { data, error } = await supabase
    .from('knowledge_cards')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching knowledge cards:', error)
    throw error
  }
  
  return data
}

// 新しいユーザー登録時にプロフィールを作成する関数
export async function createProfileForNewUser(userId, email, name = null) {
  try {
    const displayName = name || email.split('@')[0];
    
    // プロフィールデータを準備
    const profile = {
      id: userId,
      email,
      name: displayName,
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
      created_at: new Date().toISOString(),
    };
    
    // サービスロールクライアントがあれば使用し、なければ通常のクライアントを使用
    const client = supabaseAdmin || supabase;
    
    // プロフィールを挿入
    const { error } = await client
      .from('profiles')
      .insert([profile]);
    
    if (error) {
      console.error('Error creating profile:', error);
      return { error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Exception in createProfileForNewUser:', error);
    return { error: error.message };
  }
}

// ユーザーの投稿を取得する関数
export async function getUserPosts(userId) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, name, avatar_url),
      comments:id (
        *,
        profiles:user_id (id, name, avatar_url)
      ),
      reactions:id (
        *,
        profiles:user_id (id, name, avatar_url)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user posts:', error)
    throw error
  }
  
  return data
}

// 投稿を削除する関数
export async function deletePost(postId) {
  // 関連するコメントとリアクションを削除
  await supabase.from('comments').delete().eq('post_id', postId)
  await supabase.from('reactions').delete().eq('post_id', postId)
  
  // 投稿を削除
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
  
  if (error) {
    console.error('Error deleting post:', error)
    throw error
  }
  
  return true
}

// コメントを作成する関数
export async function createComment(userId, postId, content) {
  const { data, error } = await supabase
    .from('comments')
    .insert([
      { 
        user_id: userId, 
        post_id: postId, 
        content 
      }
    ])
    .select(`
      *,
      profiles:user_id (id, name, avatar_url)
    `)
  
  if (error) {
    console.error('Error creating comment:', error)
    throw error
  }
  
  return data[0]
}

// リアクションを追加/更新/削除する関数
export async function handleReaction(userId, postId, reactionType) {
  // 既存のリアクションを確認
  const { data: existingReaction } = await supabase
    .from('reactions')
    .select('*')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()
  
  if (existingReaction) {
    // 同じタイプなら削除、違うタイプなら更新
    if (existingReaction.type === reactionType) {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id)
      
      if (error) {
        console.error('Error deleting reaction:', error)
        throw error
      }
      
      return null
    } else {
      const { data, error } = await supabase
        .from('reactions')
        .update({ type: reactionType })
        .eq('id', existingReaction.id)
        .select()
      
      if (error) {
        console.error('Error updating reaction:', error)
        throw error
      }
      
      return data[0]
    }
  } else {
    // 新規リアクション
    const { data, error } = await supabase
      .from('reactions')
      .insert([
        { 
          user_id: userId, 
          post_id: postId, 
          type: reactionType 
        }
      ])
      .select()
    
    if (error) {
      console.error('Error creating reaction:', error)
      throw error
    }
    
    return data[0]
  }
}

// AI豆知識カードを生成する関数
export async function generateAIKnowledgeCard(postId) {
  console.log('SERVER: Starting AI knowledge card generation for post:', postId)
  
  if (!postId) {
    console.error('SERVER: Invalid post ID provided')
    throw new Error('Invalid post ID provided')
  }
  
  try {
    // 投稿の内容を取得
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('title, content')
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
      return { error: postError.message };
    }

    if (!post) {
      return { error: '投稿が見つかりませんでした' };
    }

    // 投稿内容から知識カードのタイトルと内容を生成
    const title = post.title;
    const content = post.content;
    const tags = ['AI生成', 'コーヒー'];

    console.log('SERVER: Inserting knowledge card with title:', title)
    
    // サービスロールクライアントがあれば使用し、なければ通常のクライアントを使用
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('knowledge_cards')
      .insert([{
        title,
        content,
        tags,
        source_post_id: postId
      }])
      .select();

    if (error) {
      console.error('Error creating knowledge card:', error);
      return { error: error.message };
    }

    return { data: data[0] };
  } catch (error) {
    console.error('Error in generateAIKnowledgeCard:', error);
    return { error: error.message };
  }
}

// ユーザープロフィールを更新する関数
export async function updateUserProfile(userId, updates) {
  const client = supabaseAdmin || supabase;
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, email, name, avatar_url, created_at')
  
  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
  
  return data[0]
}

// カテゴリーを初期化する関数
export async function initializeCategories() {
  const categories = [
    { id: uuidv4(), name: '[初心者向け] AIはじめの一歩', description: 'AIとは？、用語解説、おすすめ学習方法、質問広場', icon_url: 'beginner.png' },
    { id: uuidv4(), name: '[活用事例] みんなのAI活用術', description: '業務効率化、アイデア創出、エンタメ、各業界での活用事例', icon_url: 'usecase.png' },
    { id: uuidv4(), name: '[ツール・サービス] AIツールレビュー', description: 'ChatGPT, Stable Diffusion, 各種AIツールの比較・レビュー、おすすめツール紹介', icon_url: 'tools.png' },
    { id: uuidv4(), name: '[悩み相談] AIなんでも相談室', description: '導入の壁、倫理的な課題、キャリア相談、その他AIに関する悩み', icon_url: 'consultation.png' },
    { id: uuidv4(), name: '[専門家向け] AI技術深掘り', description: '最新研究動向、技術議論、論文紹介、開発 tips', icon_url: 'expert.png' },
    { id: uuidv4(), name: '[雑談・交流] AIフリートーク', description: '自己紹介、雑談、イベント告知、交流', icon_url: 'free.png' },
  ];

  // 既存のカテゴリーを取得
  const { data: existingCategories, error: fetchError } = await supabase
    .from('category')
    .select('*');

  if (fetchError) {
    console.error('カテゴリー取得エラー:', fetchError);
    return null;
  }

  // 既存のカテゴリーがない場合は初期データを挿入
  if (!existingCategories || existingCategories.length === 0) {
    const { data, error } = await supabase
      .from('category')
      .insert(categories)
      .select();

    if (error) {
      console.error('カテゴリー初期化エラー:', error);
      return null;
    }

    return data;
  }

  return existingCategories;
}

// カテゴリーを取得する関数
export async function getCategories() {
  const { data, error } = await supabase
    .from('category')
    .select('*')
    .order('name');

  if (error) {
    console.error('カテゴリー取得エラー:', error);
    return [];
  }

  return data || [];
}

// カテゴリーIDからカテゴリー情報を取得する関数
export async function getCategoryById(id) {
  const { data, error } = await supabase
    .from('category')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('カテゴリー取得エラー:', error);
    return null;
  }

  return data;
}
