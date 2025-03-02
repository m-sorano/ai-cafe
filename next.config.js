/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'images.unsplash.com', 'ui-avatars.com', 'vfyqhpgrsfupsahmyzuf.supabase.co'],
    unoptimized: true,
  },
  output: 'export',
  // Cloudflare Pages向けに静的エクスポート時にAPIルートを除外
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
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
