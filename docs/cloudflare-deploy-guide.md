# Cloudflare Pagesへのデプロイガイド

このガイドでは、「生成AI相談室」アプリケーションをCloudflare Pagesにデプロイする方法について説明します。

## 1. 必要な設定ファイル

### wrangler.toml
プロジェクトのルートディレクトリに`wrangler.toml`ファイルを作成しました。このファイルはCloudflare Workersの設定ファイルで、以下の内容を含んでいます：

```toml
name = "ai-cafe"
main = "pages/index.js"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

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
  exportPathMap: async function (defaultPathMap) {
    // APIルートを除外した新しいpathMapを作成
    const pathMap = {};
    for (const [path, config] of Object.entries(defaultPathMap)) {
      if (!path.startsWith('/api/')) {
        pathMap[path] = config;
      }
    }
    return pathMap;
  },
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

Cloudflare Pagesで環境変数を設定する方法は複数あります：

### 方法1: wrangler.tomlでの設定

`wrangler.toml`ファイルに環境変数を直接設定できます：

```toml
[vars]
NEXT_PUBLIC_SUPABASE_URL = "あなたのSupabase URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY = "あなたのSupabase匿名キー"
```

### 方法2: Cloudflareダッシュボードでの設定

Cloudflare Pagesダッシュボードの「Settings」→「Environment variables」から設定できます。

### 方法3: デプロイ時のコマンドラインでの設定

```bash
npx wrangler deploy --var NEXT_PUBLIC_SUPABASE_URL="あなたのSupabase URL" --var NEXT_PUBLIC_SUPABASE_ANON_KEY="あなたのSupabase匿名キー"
```

### フォールバック値の設定

アプリケーションコード内で環境変数が設定されていない場合のフォールバック値を提供することも重要です：

```javascript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'デフォルトのURL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'デフォルトのキー';
```

これにより、環境変数が設定されていない環境でもアプリケーションが動作するようになります。

## 4. 注意点

### Node.js互換性フラグ

Cloudflare Workersは標準ではNode.jsの組み込みモジュール（fs, path, util, stream, zlibなど）をサポートしていません。Next.jsアプリケーションをデプロイする場合、これらのモジュールが必要になることがあります。

`wrangler.toml`ファイルに以下の設定を追加することで、Node.js互換モードを有効にできます：

```toml
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2024-09-23"
```

2024年9月23日以降の`compatibility_date`を設定することで、Node.jsモジュールの解決方法が改善されます。また、念のため`nodejs_compat`フラグも併用することをお勧めします。

### APIルートの制限
Cloudflare Pagesは静的サイトホスティングサービスであるため、Next.jsのAPIルート（`pages/api/*`）は直接サポートされていません。APIルートを使用する場合は、Cloudflare Workersを別途設定する必要があります。

#### APIルートの除外

静的エクスポート時にAPIルートを除外するには、`next.config.js`に以下の設定を追加します：

```javascript
// next.config.js
module.exports = {
  // 他の設定...
  output: 'export',
  exportPathMap: async function (defaultPathMap) {
    // APIルートを除外した新しいpathMapを作成
    const pathMap = {};
    for (const [path, config] of Object.entries(defaultPathMap)) {
      if (!path.startsWith('/api/')) {
        pathMap[path] = config;
      }
    }
    return pathMap;
  },
}
```

この設定により、ビルド時にAPIルートが除外され、静的ファイルのみがエクスポートされます。APIの機能が必要な場合は、Cloudflare Workersを使用して実装する必要があります。

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
