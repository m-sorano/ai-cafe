// Supabase接続テスト
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// 環境変数を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase接続テストを開始します...')
console.log('Supabase URL:', supabaseUrl || '未設定')
console.log('Supabase匿名キー:', supabaseAnonKey ? '設定済み（セキュリティのため非表示）' : '未設定')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数が設定されていません。.env.localファイルを確認してください。')
  process.exit(1)
}

// Supabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabaseConnection() {
  try {
    // 2. 簡単なクエリを実行してみる
    console.log('テストクエリを実行します...')
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('エラーが発生しました:', error)
      return
    }
    
    console.log('クエリ成功:', data)
    console.log('Supabaseへの接続は正常です。')
  } catch (error) {
    console.error('テスト中に例外が発生しました:', error)
  }
}

// テスト実行
testSupabaseConnection()
