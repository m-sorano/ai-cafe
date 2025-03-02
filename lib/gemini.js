import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini APIキーを環境変数から取得
const apiKey = process.env.GEMINI_API_KEY;

// APIキーがない場合のエラーメッセージ
if (!apiKey) {
  console.warn(
    '⚠️ Gemini APIキーが設定されていません。' +
    '.env.localファイルを作成し、GEMINI_API_KEYを設定してください。'
  );
}

// Gemini APIクライアントの初期化
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * 投稿内容からAI豆知識カードを生成する関数
 * @param {string} content - 投稿内容
 * @returns {Promise<{title: string, content: string, tags: string[]}>}
 */
export async function generateKnowledgeCardContent(content) {
  if (!genAI) {
    throw new Error('Gemini APIキーが設定されていません');
  }

  try {
    // Gemini 2.0 Flashモデルを使用
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // プロンプトの作成
    const prompt = `
    あなたはAIに関する投稿から重要な知識を抽出するAIアシスタントです。
    以下の投稿内容から、AIに関する重要な知識や情報を抽出し、知識カードを作成してください。
    
    投稿内容:
    """
    ${content}
    """
    
    以下の形式でJSON形式で出力してください:
    {
      "title": "抽出した知識のタイトル（50文字以内）",
      "content": "抽出した知識の内容（要約・整理して300文字以内）",
      "tags": ["関連するタグ1", "関連するタグ2", "関連するタグ3"]
    }
    
    注意:
    - タイトルは簡潔で分かりやすく
    - 内容は要点をまとめて
    - タグは関連するキーワードを3〜5個
    - 投稿内容にAIに関する知識がない場合は、一般的な知識として抽出
    - 必ずJSON形式で出力すること
    `;

    // Gemini APIを呼び出し
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // JSON部分を抽出して解析
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('APIからの応答をJSONとして解析できませんでした');
    }

    const jsonText = jsonMatch[0];
    const parsedData = JSON.parse(jsonText);

    // 必要なプロパティがあるか確認
    if (!parsedData.title || !parsedData.content || !Array.isArray(parsedData.tags)) {
      throw new Error('APIからの応答に必要なプロパティがありません');
    }

    return {
      title: parsedData.title,
      content: parsedData.content,
      tags: parsedData.tags
    };
  } catch (error) {
    console.error('Error generating knowledge card with Gemini:', error);
    
    // エラー時のフォールバック（シンプルな処理）
    return {
      title: `${content.substring(0, 30)}...に関する豆知識`,
      content: content.length > 300 ? content.substring(0, 300) + '...' : content,
      tags: ['AI', '豆知識']
    };
  }
}
