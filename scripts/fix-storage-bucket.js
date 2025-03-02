// Supabaseストレージバケットの診断と修正スクリプト
import { createClient } from '@supabase/supabase-js'

// 環境変数から認証情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 認証情報のチェック
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('環境変数が設定されていません。.env.localファイルを確認してください。')
  process.exit(1)
}

// 通常のクライアント（匿名キーを使用）
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// サービスロールを使用するクライアント（管理者権限）
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

async function diagnoseStorageBucket() {
  console.log('=== Supabaseストレージバケット診断ツール ===')
  console.log('Supabase URL:', supabaseUrl)
  
  try {
    // 1. バケットの一覧を取得
    console.log('\n1. バケットの一覧を取得中...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('エラー: バケット一覧の取得に失敗しました:', bucketsError)
      
      if (bucketsError.message.includes('JWT')) {
        console.error('JWT認証エラーの可能性があります。環境変数を確認してください。')
      }
      
      return
    }
    
    if (!buckets || buckets.length === 0) {
      console.log('バケットが存在しません。')
    } else {
      console.log(`${buckets.length}個のバケットが見つかりました:`)
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (public: ${bucket.public ? 'はい' : 'いいえ'})`)
      })
    }
    
    // 2. avatarsバケットの存在確認
    console.log('\n2. avatarsバケットの確認中...')
    const avatarsBucket = buckets?.find(b => b.name === 'avatars')
    
    if (!avatarsBucket) {
      console.log('avatarsバケットが見つかりません。作成を試みます...')
      
      if (!supabaseAdmin) {
        console.error('サービスロールキーが設定されていないため、バケットを作成できません。')
        console.error('Supabaseダッシュボードで手動でバケットを作成してください。')
        return
      }
      
      // バケットの作成を試みる
      const { error: createError } = await supabaseAdmin.storage.createBucket('avatars', {
        public: true
      })
      
      if (createError) {
        console.error('エラー: avatarsバケットの作成に失敗しました:', createError)
        return
      }
      
      console.log('avatarsバケットを作成しました！')
    } else {
      console.log('avatarsバケットは存在します。')
      
      // バケットが非公開の場合は公開に設定
      if (!avatarsBucket.public && supabaseAdmin) {
        console.log('avatarsバケットが非公開です。公開に設定します...')
        
        const { error: updateError } = await supabaseAdmin.storage.updateBucket('avatars', {
          public: true
        })
        
        if (updateError) {
          console.error('エラー: バケットの公開設定に失敗しました:', updateError)
        } else {
          console.log('avatarsバケットを公開に設定しました！')
        }
      }
    }
    
    // 3. RLSポリシーの確認
    console.log('\n3. RLSポリシーの確認中...')
    
    if (!supabaseAdmin) {
      console.log('サービスロールキーが設定されていないため、RLSポリシーを確認できません。')
      console.log('Supabaseダッシュボードで手動でRLSポリシーを確認してください。')
    } else {
      // RLSポリシーの確認は複雑なため、ここでは簡易的な確認のみ
      console.log('RLSポリシーの確認には管理者権限が必要です。')
      console.log('Supabaseダッシュボードで手動でRLSポリシーを確認してください。')
    }
    
    // 4. テスト用のファイルアップロード
    console.log('\n4. テスト用のファイルアップロード中...')
    
    // テスト用の小さなBlobを作成
    const testData = 'test-data-' + Date.now()
    const testBlob = new Blob([testData], { type: 'text/plain' })
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload('test.txt', testFile, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('エラー: テストファイルのアップロードに失敗しました:', uploadError)
      
      if (uploadError.statusCode === 404 && uploadError.error === "Bucket not found") {
        console.error('バケットが見つかりませんでした。Supabaseダッシュボードで確認してください。')
      } else if (uploadError.statusCode === 400) {
        console.error('リクエストが不正です。RLSポリシーを確認してください。')
      }
      
      return
    }
    
    console.log('テストファイルをアップロードしました！')
    
    // アップロードしたファイルの公開URLを取得
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl('test.txt')
    
    console.log('公開URL:', publicUrlData.publicUrl)
    
    // テストファイルの削除
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove(['test.txt'])
    
    if (deleteError) {
      console.error('エラー: テストファイルの削除に失敗しました:', deleteError)
    } else {
      console.log('テストファイルを削除しました')
    }
    
    console.log('\n診断完了！')
    console.log('ストレージバケットは正常に動作しています。')
    
  } catch (error) {
    console.error('診断中にエラーが発生しました:', error)
  }
}

// Node.js環境で実行する場合
if (typeof window === 'undefined') {
  diagnoseStorageBucket().then(() => process.exit())
}

export default diagnoseStorageBucket
