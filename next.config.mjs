/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel'da build paytida ESLint xatolari deploy'ni to'xtatmasligi uchun.
  // (Boshlang'ich bosqichda qulay; keyinchalik false qilib qo'yish tavsiya etiladi.)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
