/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // archiver 등 Node.js 전용 패키지가 서버 번들에 포함되도록 설정
  serverExternalPackages: ['cloudinary', 'archiver', 'sharp'],
}

module.exports = nextConfig
