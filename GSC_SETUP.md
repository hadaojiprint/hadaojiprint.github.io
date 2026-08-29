# Search Console 自動取得セットアップ

この仕組みは Google Search Console API からウェアプリントLABの検索パフォーマンスを取得し、毎週月曜日の朝に GitHub Actions でレポートを作成します。

## 1. Google Cloud で準備

1. Google Cloud Console でプロジェクトを作成します。
2. 「Google Search Console API」を有効化します。
3. サービスアカウントを作成します。
4. サービスアカウントの JSON キーを1つ発行します。
5. JSON 内の `client_email` を控えます。

## 2. Search Console にサービスアカウントを追加

Search Console で対象プロパティを開き、設定 → ユーザーと権限 から、先ほどの `client_email` をユーザーとして追加します。読み取り用なので制限付き権限で構いません。

## 3. GitHub Actions Secrets を登録

このリポジトリの Settings → Secrets and variables → Actions → New repository secret から次の2つを登録します。

- `GSC_SITE_URL`
  - Search Console に表示されているプロパティ文字列をそのまま登録します。
  - URL-prefix プロパティなら例: `https://hadaojiprint.github.io/`
  - Domain プロパティなら例: `sc-domain:example.com`
- `GSC_SERVICE_ACCOUNT_JSON`
  - ダウンロードしたサービスアカウントJSONの内容を全文そのまま登録します。

**JSONキーをリポジトリのファイルとしてコミットしないでください。必ずGitHub Secretに保存します。**

## 4. 動作確認

GitHub の Actions → Weekly Search Console Report → Run workflow を実行します。

成功すると `gsc-report-<番号>` というArtifactが作成され、以下が入ります。

- `summary.json` : 直近28日とその前28日の比較、上位検索語、上位ページ
- `queries.csv` : 検索クエリ別データ
- `pages.csv` : ページ別データ

Search Console はデータ反映に時間差があるため、取得期間の終了日は実行日の3日前にしています。

## 毎週の実行時刻

GitHub Actions は毎週月曜日 07:30（日本時間）を目安に実行します。GitHubのscheduleは混雑時に多少遅れる場合があります。
