export default interface CacheInterface {
	has(key: string): boolean;
	get<T = any>(key: string): T;
	set(key: string, data: any, ttl: number): void;
	del(key: string): void;
}

