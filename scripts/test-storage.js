// Supabaseストレージバケットのテストスクリプト
import { supabase } from '../lib/supabase'

async function testStorageBucket() {
  console.log('Supabaseストレージバケットのテストを開始します...')
  
  try {
    // バケットの一覧を取得
    console.log('1. バケットの一覧を取得中...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('バケット一覧の取得に失敗しました:', bucketsError)
      return
    }
    
    console.log('バケット一覧:', buckets.map(b => b.name))
    
    // avatarsバケットの存在確認
    const avatarsBucket = buckets.find(b => b.name === 'avatars')
    
    if (!avatarsBucket) {
      console.log('avatarsバケットが存在しません。作成を試みます...')
      
      // バケットの作成
      const { error: createError } = await supabase.storage.createBucket('avatars', {
        public: true
      })
      
      if (createError) {
        console.error('avatarsバケットの作成に失敗しました:', createError)
        return
      }
      
      console.log('avatarsバケットを作成しました')
    } else {
      console.log('avatarsバケットは既に存在します')
      console.log('バケット情報:', avatarsBucket)
    }
    
    // テスト用のファイルアップロード
    console.log('2. テスト用のファイルをアップロード中...')
    
    // テスト用の小さなBlobを作成
    const testBlob = new Blob(['test'], { type: 'text/plain' })
    const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload('test.txt', testFile, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('テストファイルのアップロードに失敗しました:', uploadError)
      return
    }
    
    console.log('テストファイルをアップロードしました:', uploadData)
    
    // アップロードしたファイルの公開URLを取得
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl('test.txt')
    
    console.log('公開URL:', publicUrlData.publicUrl)
    
    // テストファイルの削除
    console.log('3. テストファイルを削除中...')
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove(['test.txt'])
    
    if (deleteError) {
      console.error('テストファイルの削除に失敗しました:', deleteError)
      return
    }
    
    console.log('テストファイルを削除しました')
    console.log('テスト完了: Supabaseストレージは正常に動作しています')
    
  } catch (error) {
    console.error('テスト中にエラーが発生しました:', error)
  }
}

// Node.js環境で実行する場合
if (typeof window === 'undefined') {
  testStorageBucket().then(() => process.exit())
}

export default testStorageBucket
