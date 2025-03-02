# Cloudflare Pagesへのデプロイガイド

このガイドでは、「生成AI相談室」アプリケーションをCloudflare Pagesにデプロイする方法について説明します。

## 1. 必要な設定ファイル

### wrangler.toml
プロジェクトのルートディレクトリに`wrangler.toml`ファイルを作成しました。このファイルはCloudflare Workersの設定ファイルで、以下の内容を含んでいます：

```toml
name = "ai-cafe"
main = "pages/index.js"
compatibility_date = "2023-12-01"

[build]
command = "npm run build"
[site]
bucket = "./out"
```

### package.jsonの修正
ビルドスクリプトを修正して、静的ファイルを生成するようにしました：

```json
"scripts": {
  "dev": "next dev",
  "build": "next build && next export",
  "start": "next start",
  "lint": "next lint",
  "deploy": "wrangler deploy"
}
```

### next.config.jsの修正
Next.jsの設定ファイルを修正して、静的エクスポートをサポートするようにしました：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'images.unsplash.com', 'ui-avatars.com', 'vfyqhpgrsfupsahmyzuf.supabase.co'],
    unoptimized: true,
  },
  output: 'export',
}

module.exports = nextConfig
```

## 2. デプロイ手順

### GitHubからのデプロイ
1. GitHubリポジトリにプッシュした変更をCloudflare Pagesが自動的に検出します
2. Cloudflare Pagesダッシュボードで新しいプロジェクトを作成し、GitHubリポジトリを接続します
3. ビルド設定を以下のように構成します：
   - ビルドコマンド: `npm run build`
   - ビルド出力ディレクトリ: `out`
   - Node.jsバージョン: 16.x以上

### 手動デプロイ
ローカル環境から直接デプロイする場合は、以下のコマンドを実行します：

```bash
npm run deploy
```

または：

```bash
npx wrangler deploy
```

## 3. 環境変数の設定

Cloudflare Pagesダッシュボードで以下の環境変数を設定する必要があります：

- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのサービスロールキー（必要に応じて）

## 4. 注意点

### APIルートの制限
Cloudflare Pagesは静的サイトホスティングサービスであるため、Next.jsのAPIルート（`pages/api/*`）は直接サポートされていません。APIルートを使用する場合は、Cloudflare Workersを別途設定する必要があります。

### 画像最適化の制限
Next.jsの画像最適化機能は静的エクスポートでは完全にはサポートされていないため、`next.config.js`で`unoptimized: true`を設定しています。

### データベース接続
SupabaseへのAPI呼び出しはクライアントサイドで行われるため、適切なCORS設定とセキュリティルールを確認してください。

## 5. トラブルシューティング

### ビルドエラー
ビルド中にエラーが発生した場合は、以下を確認してください：
- `next export`コマンドがサポートされていない機能を使用していないか
- 必要な環境変数がすべて設定されているか
- 依存関係が正しくインストールされているか

### デプロイエラー
デプロイ中にエラーが発生した場合は、Cloudflareのログを確認して具体的なエラーメッセージを特定してください。

### エントリーポイントエラー
「Missing entry-point」エラーが表示される場合は、`wrangler.toml`ファイルが正しく設定されているか確認してください。
