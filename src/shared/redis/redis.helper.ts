import { redisClient } from "../../config/redis";

export class RedisHelper {
    private redis = redisClient;

    // Helper: build stable hash field
    private buildField(query: Record<string, unknown>): string {
        const sortedQuery = Object.keys(query)
            .sort()
            .reduce((acc: Record<string, unknown>, key) => {
                acc[key] = query[key];
                return acc;
            }, {});

        return new URLSearchParams(
            sortedQuery as Record<string, string>
        ).toString();
    }

    // Helper: build stable key with optional query
    private buildKey(key: string, query?: Record<string, unknown>): string {
        if (!query || Object.keys(query).length === 0) {
            return key;
        }

        const sortedQuery = Object.keys(query)
            .sort()
            .reduce(
                (acc, currentKey) => {
                    const value = query[currentKey];

                    if (value !== undefined && value !== null) {
                        acc[currentKey] = String(value);
                    }

                    return acc;
                },
                {} as Record<string, string>
            );

        const queryString = new URLSearchParams(sortedQuery).toString();

        return `${key}:${queryString}`;
    }

    // Simple key-value set
    async set(
        key: string,
        value: unknown,
        query?: Record<string, unknown>,
        ttl: number = 60
    ): Promise<void> {
        const finalKey = this.buildKey(key, query);
        await this.redis.set(finalKey, JSON.stringify(value), "EX", ttl);
    }

    // Simple key-value get
    async get<T>(
        key: string,
        query?: Record<string, unknown>
    ): Promise<T | null> {
        const finalKey = this.buildKey(key, query);
        const rawData = await this.redis.get(finalKey);
        if (!rawData) return null;

        const data = JSON.parse(rawData) as T;
        if (Array.isArray(data) && data.length === 0) return null;

        return data;
    }

    // Hash set
    async hset(
        key: string,
        query: Record<string, unknown>,
        value: unknown,
        ttl: number = 60
    ): Promise<void> {
        const field = this.buildField(query) || "default";
        await this.redis.hset(key, field, JSON.stringify(value));
        await this.redis.expire(key, ttl);
    }

    // Hash get
    async hget<T>(
        key: string,
        query: Record<string, unknown>
    ): Promise<T | null> {
        const field = this.buildField(query) || "default";
        const rawData = await this.redis.hget(key, field);
        if (!rawData) return null;

        const data = JSON.parse(rawData) as T;
        if (Array.isArray(data) && data.length === 0) return null;

        return data;
    }

    // Delete keys by pattern
    async keyDelete(pattern: string): Promise<void> {
        const keys: string[] = [];
        const stream = this.redis.scanStream({ match: pattern });

        await new Promise<void>((resolve, reject) => {
            stream.on("data", (resultKeys: string[]) => keys.push(...resultKeys));
            stream.on("end", resolve);
            stream.on("error", reject);
        });

        if (!keys.length) return;

        const pipeline = this.redis.multi();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
    }

    async del(key: string, query?: Record<string, unknown>): Promise<void> {
        const finalKey = this.buildKey(key, query);
        await this.redis.del(finalKey);
    }

    // Delete all fields in a hash
    async hKeyDelete(key: string): Promise<void> {
        const fields = await this.redis.hkeys(key);
        if (!fields.length) return;

        await this.redis.hdel(key, ...fields);
    }
}

// singleton instance — sob module ei ekta instance import kore use korbe
export const redisHelper = new RedisHelper();
