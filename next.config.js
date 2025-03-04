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
