# Git 基本ガイド

このガイドでは、Git と GitHub を使用したプロジェクト管理の基本的な方法について説明します。

## 1. 基本的な Git コマンド

### 初期設定
```bash
# ユーザー名とメールアドレスの設定
git config --global user.name "あなたの名前"
git config --global user.email "あなたのメールアドレス"
```

### リポジトリの作成と接続
```bash
# 新しいリポジトリを初期化
git init

# リモートリポジトリを追加
git remote add origin https://github.com/ユーザー名/リポジトリ名.git

# リモートリポジトリの確認
git remote -v
```

### 基本的な操作
```bash
# 変更ファイルの状態確認
git status

# 変更をステージングに追加
git add ファイル名    # 特定のファイルを追加
git add .           # すべての変更を追加

# 変更をコミット
git commit -m "コミットメッセージ"

# リモートリポジトリにプッシュ
git push -u origin ブランチ名   # 初回プッシュ
git push                      # 2回目以降のプッシュ

# リモートリポジトリから最新の変更を取得
git pull
```

## 2. ブランチの操作

```bash
# 現在のブランチを確認
git branch

# 新しいブランチを作成
git branch ブランチ名

# ブランチを切り替え
git checkout ブランチ名
# または
git switch ブランチ名

# ブランチの作成と切り替えを同時に行う
git checkout -b ブランチ名

# ブランチをマージ
git merge ブランチ名

# ブランチを削除
git branch -d ブランチ名
```

## 3. 効果的な Git ワークフロー

### 機能開発のワークフロー
1. メインブランチから新しい機能ブランチを作成
   ```bash
   git checkout main
   git pull
   git checkout -b feature/新機能名
   ```

2. 機能を開発し、小さな単位でコミット
   ```bash
   git add .
   git commit -m "機能の説明"
   ```

3. 開発が完了したら、リモートにプッシュ
   ```bash
   git push -u origin feature/新機能名
   ```

4. GitHub でプルリクエストを作成

5. レビュー後、マージしてブランチを削除
   ```bash
   git checkout main
   git pull
   git branch -d feature/新機能名
   ```

## 4. 便利な Git コマンド

```bash
# コミット履歴の確認
git log
git log --oneline --graph

# 変更の差分を確認
git diff
git diff ファイル名

# 直前のコミットを修正
git commit --amend

# 変更を一時的に退避
git stash
git stash pop

# タグ付け
git tag -a v1.0.0 -m "バージョン1.0.0"
git push --tags
```

## 5. .gitignore ファイル

`.gitignore` ファイルは、Git が追跡しないファイルやディレクトリを指定するために使用します。

```
# Node.js
node_modules/
npm-debug.log

# 環境変数
.env
.env.local

# ビルドファイル
.next/
out/
build/

# OS固有のファイル
.DS_Store
Thumbs.db
```

## 6. GitHub での認証

GitHub への認証には、以下の方法があります：

1. **パスワード認証**（非推奨）
2. **個人アクセストークン（PAT）**
   - GitHub の Settings > Developer settings > Personal access tokens で生成
   - `git clone` や `git push` 時にパスワードの代わりに使用
3. **SSH 認証**
   - SSH キーペアを生成し、GitHub アカウントに公開鍵を追加
   - リモートURLを SSH 形式に変更: `git remote set-url origin git@github.com:ユーザー名/リポジトリ名.git`

## 7. トラブルシューティング

### コンフリクトの解決
1. コンフリクトが発生したファイルを開く
2. コンフリクトマーカー（`<<<<<<<`, `=======`, `>>>>>>>`)を探し、コードを適切に編集
3. 変更をステージングに追加し、コミット
   ```bash
   git add .
   git commit -m "コンフリクトを解決"
   ```

### その他の一般的な問題
- **プッシュが拒否された場合**: 先にプルして最新の変更を取得
  ```bash
  git pull --rebase
  git push
  ```
- **コミットの取り消し**:
  ```bash
  git reset --soft HEAD~1  # 直前のコミットを取り消し（変更は保持）
  git reset --hard HEAD~1  # 直前のコミットを完全に取り消し（変更も破棄）
  ```

## 8. GitHub の便利な機能

- **Issues**: バグ報告や機能リクエストの管理
- **Pull Requests**: コードレビューと変更の統合
- **Actions**: 自動ビルド、テスト、デプロイのためのCI/CD
- **Projects**: タスク管理とプロジェクト進行状況の追跡
- **Wiki**: プロジェクトのドキュメント作成

## 9. セキュリティのベストプラクティス

1. 機密情報（APIキー、パスワードなど）をコミットしない
2. 定期的に依存関係を更新して脆弱性を回避
3. ブランチ保護ルールを設定して、直接mainブランチにプッシュできないようにする
4. コードレビューを必須にする
5. 2要素認証を有効にする

## 10. 参考リソース

- [Git 公式ドキュメント](https://git-scm.com/doc)
- [GitHub ドキュメント](https://docs.github.com/)
- [Pro Git 書籍（無料）](https://git-scm.com/book/ja/v2)
- [GitHub Skills](https://skills.github.com/)
