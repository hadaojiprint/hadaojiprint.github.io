import { ArrowRight, Check, Layers3, Palette, Ruler, Shirt, Sparkles } from "lucide-react";

const topics = [
  { icon: Shirt, no: "01", title: "プリント方法", text: "シルクスクリーン、DTF、インクジェット。枚数やデザインに合う方法を比べます。" },
  { icon: Ruler, no: "02", title: "サイズ・位置", text: "胸・背中・袖の見え方や、入稿前に知っておきたい適正サイズを解説します。" },
  { icon: Palette, no: "03", title: "デザイン入門", text: "CanvaやAIで作った画像を、きれいなプリントデータにするコツを紹介します。" },
  { icon: Layers3, no: "04", title: "ボディ比較", text: "定番Tシャツからドライ素材まで、用途・着心地・価格の違いが分かります。" },
];

const articles = [
  { label: "はじめての方へ", title: "オリジナルTシャツは1枚から作れる？ 方法と料金の考え方", meta: "7分で読める", tone: "mint" },
  { label: "プリント方法", title: "シルクスクリーンとDTFプリント、どちらを選べばいい？", meta: "比較表つき", tone: "navy" },
  { label: "デザイン", title: "Canvaで作ったデザインをTシャツにプリントするまで", meta: "初心者向け", tone: "yellow" },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ウェアプリントLAB トップ">
          <span className="brand-mark">W</span><span><strong>ウェアプリント</strong><b>LAB</b></span>
        </a>
        <nav aria-label="メインナビゲーション"><a href="#topics">基礎知識</a><a href="#articles">記事を読む</a><a href="#about">このサイトについて</a></nav>
        <a className="header-cta" href="#start">はじめての方へ <ArrowRight size={16} /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> ORIGINAL WEAR GUIDE</p>
          <h1>つくりたいを、<br />ちゃんと<span>カタチ</span>に。</h1>
          <p className="hero-lead">オリジナルTシャツやウェアプリントの疑問を、<br />現場の目線で分かりやすく解決するメディアです。</p>
          <div className="hero-actions"><a className="primary-button" href="#start">最初に読むガイド <ArrowRight size={18} /></a><a className="text-link" href="#articles">新着記事を見る</a></div>
          <ul className="trust-list"><li><Check size={15} />1枚からの作り方</li><li><Check size={15} />プロの現場知識</li><li><Check size={15} />初心者向け</li></ul>
        </div>
        <div className="hero-visual">
          <img src="/wearprint-lab-hero.png" alt="ネイビーのTシャツをシルクスクリーンで印刷する作業台" />
          <div className="visual-note note-one"><Sparkles size={17} />つくる前に知る</div>
          <div className="visual-note note-two"><Shirt size={17} />1枚からでもOK</div>
          <span className="visual-index">01</span>
        </div>
      </section>

      <section className="intro-strip" id="about">
        <p>KNOWLEDGE FROM THE PRINT SHOP</p>
        <div><strong>プリントの「分からない」をなくす。</strong><span>注文する前に知っておきたいことを、難しい言葉を使わずに解説します。</span></div>
      </section>

      <section className="section" id="topics">
        <div className="section-heading"><div><p className="eyebrow"><span /> LEARN BY TOPIC</p><h2>知りたいことから探す</h2></div><p>はじめてでも大丈夫。4つのテーマから、今の疑問に近いものを選んでください。</p></div>
        <div className="topic-grid">
          {topics.map((topic) => { const Icon = topic.icon; return (
            <article className="topic-card" key={topic.title}>
              <div className="topic-top"><Icon size={29} strokeWidth={1.6} /><span>{topic.no}</span></div>
              <h3>{topic.title}</h3><p>{topic.text}</p><a href="#articles">記事を見る <ArrowRight size={16} /></a>
            </article>
          ); })}
        </div>
      </section>

      <section className="section start-section" id="start">
        <div className="start-panel">
          <div className="start-number">START<br /><b>01</b></div>
          <div className="start-copy"><p className="eyebrow light"><span /> FIRST GUIDE</p><h2>まずはここから。<br />失敗しないTシャツづくり</h2><p>枚数、予算、素材、プリント方法。最初に決める4つのポイントを順番に紹介します。</p><a href="#articles">入門ガイドを読む <ArrowRight size={18} /></a></div>
          <div className="steps"><div><b>1</b><span>用途を決める</span></div><div><b>2</b><span>ボディを選ぶ</span></div><div><b>3</b><span>方法を比べる</span></div><div><b>4</b><span>データを用意</span></div></div>
        </div>
      </section>

      <section className="section articles-section" id="articles">
        <div className="section-heading"><div><p className="eyebrow"><span /> NEW ARTICLES</p><h2>新着記事</h2></div><a className="text-link" href="#articles">すべての記事 <ArrowRight size={16} /></a></div>
        <div className="article-grid">
          {articles.map((article, index) => (
            <article className="article-card" key={article.title}>
              <div className={`article-cover ${article.tone}`}><span>0{index + 1}</span><Shirt size={55} strokeWidth={1.15} /></div>
              <div className="article-body"><div><span>{article.label}</span><small>{article.meta}</small></div><h3>{article.title}</h3><a href="#start"><ArrowRight size={19} /></a></div>
            </article>
          ))}
        </div>
      </section>

      <section className="closing"><div><p className="eyebrow"><span /> WEAR PRINT LAB</p><h2>あなたの一枚が、<br />もっと良くなる知識を。</h2></div><p>ウェアプリントLABは、実際のプリント現場で得た経験をもとに発信しています。</p></section>
      <footer><a className="brand" href="#top"><span className="brand-mark">W</span><span><strong>ウェアプリント</strong><b>LAB</b></span></a><p>オリジナルウェアづくりを、もっと分かりやすく。</p><div><a href="#about">運営者情報</a><a href="#about">プライバシーポリシー</a><a href="#about">お問い合わせ</a></div><small>© 2026 WEAR PRINT LAB</small></footer>
    </main>
  );
}
