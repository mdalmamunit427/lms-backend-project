interface Config {
    port: number;
    nodeEnv: string;
    database_url: string;
    redis_url: string;
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    cloudinary_cloud_name: string;
    cloudinary_api_key: string;
    cloudinary_api_secret: string;
}
declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map