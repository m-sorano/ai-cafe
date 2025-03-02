import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import Link from 'next/link'

const About = () => {
  return (
    <Layout>
      <div className="cafe-container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-center text-coffee-dark mb-6">
            生成AI相談室について
          </h1>

          <div className="cafe-card bg-cream mb-8">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">
              コンセプト
            </h2>
            <p className="text-coffee-medium mb-4">
              生成AI相談室は、AIに関する情報交換のための、カフェのような雰囲気を持つ掲示板アプリケーションです。
              リラックスした空間で、AIについての会話を楽しみ、知識を深め、新しい発見をすることを目指しています。
            </p>
            <p className="text-coffee-medium">
              カフェでくつろぎながら友人と会話するように、AI技術について気軽に話し合える場所を提供します。
              初心者からエキスパートまで、誰もが参加できるコミュニティです。
            </p>
          </div>

          <div className="cafe-card bg-cream mb-8">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">
              特徴
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold text-coffee-dark mb-2">
                  ブレンド選択
                </h3>
                <p className="text-coffee-medium">
                  様々なAIトピックを「ブレンド」として分類。
                  あなたの興味や専門分野に合わせたブレンドを選んで、会話を楽しめます。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-coffee-dark mb-2">
                  ラテアートリアクション
                </h3>
                <p className="text-coffee-medium">
                  従来の「いいね」の代わりに、ラテアートをモチーフにしたリアクションで
                  投稿に対する感想を表現できます。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-coffee-dark mb-2">
                  AI豆知識カード
                </h3>
                <p className="text-coffee-medium">
                  会話から生まれた知識を「豆知識カード」として自動的に抽出・整理。
                  いつでも参照できる知識ベースを構築します。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-coffee-dark mb-2">
                  リラックスした雰囲気
                </h3>
                <p className="text-coffee-medium">
                  カフェをイメージした温かみのあるデザインで、
                  リラックスしながらAIについて語り合える空間を提供します。
                </p>
              </div>
            </div>
          </div>

          <div className="cafe-card bg-cream mb-8">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">
              利用方法
            </h2>
            <ol className="list-decimal list-inside space-y-4 text-coffee-medium">
              <li>
                <span className="font-bold">アカウント作成</span>：
                メールアドレスまたはソーシャルアカウントで簡単に登録できます。
              </li>
              <li>
                <span className="font-bold">ブレンド選択</span>：
                興味のあるAIトピックのブレンドを選びます。
              </li>
              <li>
                <span className="font-bold">投稿・コメント</span>：
                質問、意見、知識などを自由に投稿したり、他の投稿にコメントしたりできます。
              </li>
              <li>
                <span className="font-bold">リアクション</span>：
                ラテアートリアクションで投稿への感想を表現できます。
              </li>
              <li>
                <span className="font-bold">豆知識カード</span>：
                自動生成された豆知識カードを閲覧して、AIに関する知識を深めることができます。
              </li>
            </ol>
          </div>

          <div className="cafe-card bg-cream mb-8">
            <h2 className="text-2xl font-bold text-coffee-dark mb-4">
              コミュニティガイドライン
            </h2>
            <ul className="list-disc list-inside space-y-2 text-coffee-medium">
              <li>他のユーザーを尊重し、礼儀正しく接しましょう。</li>
              <li>建設的な議論を心がけ、不適切な言動は避けましょう。</li>
              <li>著作権を尊重し、適切に引用・参照を行いましょう。</li>
              <li>プライバシーを尊重し、個人情報の共有は控えましょう。</li>
              <li>AIに関する誤解や神話を広めないよう、事実に基づいた情報を共有しましょう。</li>
            </ul>
          </div>

          <div className="text-center">
            <Link href="/" className="cafe-button inline-block">
              生成AI相談室を始める
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}

export default About
