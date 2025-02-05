/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                fs: false,
                crypto: false,
                stream: false,
                path: false,
            };
        }
        return config;
    },
    async rewrites() {
        return [
            {
                source: '/cloud-agent/:path*',
                destination: 'http://localhost:8085/:path*'
            },
            {
                source: '/didcomm',
                destination: 'http://localhost:8090'
            }
        ]
    }
}

module.exports = nextConfig
