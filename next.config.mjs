import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'fra1.digitaloceanspaces.com',
      'pictures-compliance.fra1.digitaloceanspaces.com',
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://py.auditaxs.com.br/api/:path*',
      },
    ]
  },
}

export default withNextIntl(nextConfig)
