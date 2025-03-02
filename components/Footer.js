import Link from 'next/link'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-consultation-dark text-white py-8 mt-12">
      <div className="cafe-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">生成AI相談室</h3>
            <p className="text-sm mb-4">
              AIの疑問、みんなで解決！初心者から専門家まで集う生成AI相談室
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">リンク</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm hover:text-consultation-light transition-colors">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/knowledge" className="text-sm hover:text-consultation-light transition-colors">
                  AI豆知識
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">お問い合わせ</h3>
            <p className="text-sm mb-2">
              ご質問やフィードバックがありましたら、お気軽にお問い合わせください。
            </p>
            <Link href="/contact" className="text-sm text-consultation hover:text-consultation-light transition-colors">
              お問い合わせフォーム
            </Link>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm">
          <p>&copy; {currentYear} 生成AI相談室 All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
