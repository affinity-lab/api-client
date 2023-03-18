import type {AxiosInstance, AxiosRequestConfig, AxiosResponse} from "axios";
import axios from "axios";

import Result from "./result";
import type {RequestEvent} from "@sveltejs/kit";
import type ApiBuilder from "./builder";
import type {Decorator} from "./types";
import {BodyFormat, Method} from "./types";

export interface IClient<R> {
	call(requestEvent: RequestEvent): Promise<Result<R>>;
	query(data: any): this;
	decorate(decorator: Decorator): this;
}

export interface IClientWithCache {
	cache(ttl: number): this;
}

export interface IClientWithBody {
	body(data: any): this;
}


export default class Client {

	private queryData: any;
	private data: any;
	private cacheTTL: number = 0;
	private decorators: Decorator[] = [];

	constructor(
		private url: string,
		private method: Method,
		private useAuth: boolean,
		private useCache: boolean,
		private format: BodyFormat,
		private config: ApiBuilder
	) {}

	decorate(decorator: Decorator): this {
		this.decorators.push(decorator);
		return this;
	}

	query(data: any): this {
		this.queryData = data;
		return this;
	}
	body(data: any): this {
		this.data = data;
		return this;
	}
	cache(ttl: number): this {
		this.cacheTTL = ttl;
		return this;
	}

	private get isCached(): boolean { return this.useCache && this.method === Method.GET && this.cacheTTL > 0 && !this.useAuth && this.config.getCacheService() !== undefined }

	async call(requestEvent: RequestEvent): Promise<Result> {

		let config: AxiosRequestConfig = {
			url: this.url,
			method: this.method,
			data: this.data,
			params: this.queryData,
			headers: {}
		};
		if (this.format !== BodyFormat.None) config.headers!["Content-Type"] = this.format === BodyFormat.JSON ? "application/json" : "multipart/form-data"

		let request = axios.create();
		if (this.useAuth) this.config.getAuthDecorators().forEach(decorator => decorator.decorate(request, requestEvent));
		this.config.getDecorators().forEach(decorator => decorator.decorate(request, requestEvent));

		if (this.isCached) {
			let cacheService = this.config.getCacheService()!;
			let uri = request.getUri({url: this.url});
			let result: Result<any>;
			if (cacheService.has(uri)) {
				result = cacheService.get(uri);
			} else {
				result = await Result.handle(request.request(config));
				result.onSuccess(() => cacheService?.set(uri, result, this.cacheTTL))
			}
			return result;
		} else {
			return await Result.handle(request.request(config));
		}
	}

}
