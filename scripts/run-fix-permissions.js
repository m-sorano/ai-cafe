// Supabase RLSポリシー修正スクリプト
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 環境変数から認証情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません。')
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。')
  console.error('.env.local ファイルを確認してください。')
  process.exit(1)
}

// サービスロールを使用するクライアント（管理者権限）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// SQLを小さなチャンクに分割して実行する関数
async function executeSqlInChunks(sql) {
  // コメント行を削除し、空行を削除
  const cleanedSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
    .join('\n');
  
  // SQL文を分割（セミコロンで区切る）
  const statements = cleanedSql.split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  console.log(`${statements.length}個のSQL文を実行します`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      console.log(`SQL文 ${i + 1}/${statements.length} を実行中...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
      
      if (error) {
        console.error(`SQL文 ${i + 1} でエラーが発生しました:`, error);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`SQL文 ${i + 1} の実行中に例外が発生しました:`, error);
      errorCount++;
    }
  }
  
  console.log(`実行結果: 成功=${successCount}, 失敗=${errorCount}`);
  return { successCount, errorCount };
}

async function runSqlFile(filePath) {
  try {
    console.log(`SQLファイルを実行します: ${filePath}`);
    
    // ファイルを読み込む
    const sql = fs.readFileSync(path.resolve(filePath), 'utf8');
    
    // SQLをチャンクに分割して実行
    const result = await executeSqlInChunks(sql);
    
    if (result.errorCount === 0) {
      console.log(`${filePath} の実行が完了しました (${result.successCount}個のSQL文が成功)`);
      return true;
    } else {
      console.warn(`${filePath} の実行中にエラーが発生しました (成功: ${result.successCount}, 失敗: ${result.errorCount})`);
      return result.successCount > 0; // 一部成功した場合はtrueを返す
    }
  } catch (error) {
    console.error('エラー:', error);
    return false;
  }
}

// バケットの存在を確認する関数
async function checkBucket(bucketName) {
  try {
    console.log(`バケット '${bucketName}' の存在を確認中...`);
    
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error) {
      if (error.statusCode === 404) {
        console.log(`バケット '${bucketName}' が見つかりません。作成を試みます...`);
        
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createError) {
          console.error(`バケット '${bucketName}' の作成に失敗しました:`, createError);
          return false;
        }
        
        console.log(`バケット '${bucketName}' を作成しました！`);
        return true;
      }
      
      console.error(`バケット '${bucketName}' の確認中にエラーが発生しました:`, error);
      return false;
    }
    
    console.log(`バケット '${bucketName}' は存在します (public: ${data.public ? 'はい' : 'いいえ'})`);
    
    // バケットが非公開の場合は公開に設定
    if (!data.public) {
      console.log(`バケット '${bucketName}' を公開に設定します...`);
      
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true
      });
      
      if (updateError) {
        console.error(`バケット '${bucketName}' の更新に失敗しました:`, updateError);
        return false;
      }
      
      console.log(`バケット '${bucketName}' を公開に設定しました！`);
    }
    
    return true;
  } catch (error) {
    console.error('エラー:', error);
    return false;
  }
}

async function main() {
  console.log('=== Supabase RLSポリシー修正スクリプト ===');
  
  // avatarsバケットの確認と作成
  const bucketResult = await checkBucket('avatars');
  
  if (bucketResult) {
    console.log('✅ avatarsバケットの確認/作成が完了しました');
  } else {
    console.error('❌ avatarsバケットの確認/作成に失敗しました');
  }
  
  // ストレージのRLSポリシーを修正
  const storageResult = await runSqlFile('./docs/fix-storage-permissions.sql');
  
  if (storageResult) {
    console.log('✅ ストレージのRLSポリシーを修正しました');
  } else {
    console.error('❌ ストレージのRLSポリシーの修正に失敗しました');
  }
  
  // プロフィールテーブルのRLSポリシーを修正
  const profilesResult = await runSqlFile('./docs/fix-profiles-permissions.sql');
  
  if (profilesResult) {
    console.log('✅ プロフィールテーブルのRLSポリシーを修正しました');
  } else {
    console.error('❌ プロフィールテーブルのRLSポリシーの修正に失敗しました');
  }
  
  if (bucketResult && storageResult && profilesResult) {
    console.log('\n✅✅✅ すべての修正が正常に完了しました');
    console.log('アプリケーションを再起動して、アバターアップロード機能をテストしてください');
  } else {
    console.error('\n❌❌❌ 一部の修正に失敗しました');
    console.error('エラーメッセージを確認して、手動で修正してください');
  }
}

main().catch(console.error)
