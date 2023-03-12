import type CacheInterface from "../cache-interface";

export default class InMemoryCache implements CacheInterface {

	private storage: Map<string, Cached> = new Map();

	public get<T = any>(key: string): T { return this.storage.has(key) ? this.storage.get(key)!.data : undefined;}

	public has(key: string): boolean { return this.storage.has(key);}

	public set(key: string, data: any, ttl: number): void {
		this.del(key);
		let timoutId = setTimeout(() => this.del(key), ttl * 1000);
		this.storage.set(key, new Cached(data, timoutId));
	}

	public del(key: string) {
		if (this.has(key)) {
			clearTimeout(this.storage.get(key)!.timeoutId);
			this.storage.delete(key);
		}
	}
}

class Cached {
	constructor(public data: any, public timeoutId: any) {}
}