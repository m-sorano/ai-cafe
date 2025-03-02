# Vercelデプロイガイド

このガイドでは、「生成AI相談室」アプリケーションをVercelにデプロイする手順を説明します。

## 1. 前提条件

- Vercelアカウント（[vercel.com](https://vercel.com)で作成できます）
- GitHubアカウント（リポジトリをホストするため）
- プロジェクトのGitHubリポジトリ

## 2. デプロイ準備

### 設定ファイルの確認

1. `next.config.js`の設定が正しいことを確認します：
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     reactStrictMode: true,
     images: {
       domains: ['localhost', 'images.unsplash.com', 'ui-avatars.com', 'vfyqhpgrsfupsahmyzuf.supabase.co'],
       unoptimized: false,
     },
     output: 'server',
   }
   
   module.exports = nextConfig
   ```

2. `vercel.json`ファイルが存在し、必要な設定が含まれていることを確認します：
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/next"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/$1"
       }
     ],
     "env": {
       "NEXT_PUBLIC_SUPABASE_URL": "https://vfyqhpgrsfupsahmyzuf.supabase.co",
       "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmeXFocGdyc2Z1cHNhaG15enVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MDI3ODksImV4cCI6MjA1NjM3ODc4OX0.PpfL4Us0BURl5vr6xdlAlvacTR-vp0JRPnE0_07SJBw",
       "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmeXFocGdyc2Z1cHNhaG15enVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDgwMjc4OSwiZXhwIjoyMDU2Mzc4Nzg5fQ.p6H6N3jhkzNgtO8Ynl73RyiVF_UJrm1uKlazYwwKFsw"
     }
   }
   ```

### 環境変数の設定

Vercelダッシュボードで環境変数を設定することもできますが、`vercel.json`ファイルに記載することでも設定できます。セキュリティ上の理由から、本番環境では環境変数をVercelダッシュボードで設定することをお勧めします。

## 3. デプロイ手順

### GitHubとの連携

1. GitHubリポジトリにプロジェクトをプッシュします
2. [Vercel](https://vercel.com)にログインします
3. 「New Project」をクリックします
4. 「Import Git Repository」セクションからGitHubリポジトリを選択します
5. 必要に応じて設定を調整します（通常はデフォルト設定で問題ありません）
6. 「Deploy」ボタンをクリックしてデプロイを開始します

### 環境変数の設定（Vercelダッシュボード）

1. プロジェクトのダッシュボードに移動します
2. 「Settings」タブをクリックします
3. 左側のメニューから「Environment Variables」を選択します
4. 以下の環境変数を追加します：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. 「Save」ボタンをクリックして保存します

## 4. Vercelの特徴と利点

### サーバーサイドレンダリング（SSR）のサポート

Vercelは Next.js の開発元であり、SSRを完全にサポートしています。APIルートも問題なく動作します。

### 自動デプロイ

GitHubリポジトリに変更をプッシュすると、Vercelは自動的に新しいビルドを開始し、デプロイします。

### プレビュー機能

プルリクエストごとにプレビュー環境が自動的に作成されるため、変更を本番環境にマージする前に確認できます。

### カスタムドメイン

独自ドメインを簡単に設定できます。Vercelダッシュボードの「Domains」セクションから設定できます。

## 5. トラブルシューティング

### ビルドエラー

ビルドエラーが発生した場合は、Vercelダッシュボードの「Deployments」タブからデプロイを選択し、ビルドログを確認してください。

### 環境変数の問題

環境変数が正しく設定されていない場合、アプリケーションが正常に動作しない可能性があります。Vercelダッシュボードで環境変数が正しく設定されていることを確認してください。

### APIルートの問題

APIルートが動作しない場合は、`next.config.js`の`output`設定が`server`になっていることを確認してください。

## 6. 参考リンク

- [Vercel公式ドキュメント](https://vercel.com/docs)
- [Next.js公式ドキュメント](https://nextjs.org/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
