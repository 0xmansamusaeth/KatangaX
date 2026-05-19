/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "porto/internal": false,
      "@react-native-async-storage/async-storage": false,
    };
    config.externals.push("pino-pretty");
    return config;
  },
};

export default nextConfig;
