const nextConfig = {
    webpack(config, { dev }) {
        if (!dev) {
            config.devtool = 'source-map'; // ✅ only in production
        }
        return config;
    },
};

module.exports = nextConfig;