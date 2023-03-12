import type {AxiosInstance, AxiosResponse} from "axios";
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

export interface IClientWithBody{
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

	private async sendCachedRequest(request: AxiosInstance): Promise<Result<any>> {
		let cacheService = this.config.getCacheService()!;
		let uri = request.getUri({url: this.url});
		let result: Result<any> | null;
		if (cacheService.has(uri)) {
			result = cacheService.get(uri);
		} else {
			result = await Result.handle(request.get(this.url));
			result.onSuccess(() => cacheService?.set(uri, result, this.cacheTTL))
		}
		return result!;
	}

	private async sendRequest(request: AxiosInstance): Promise<Result<any>> {
		let response: Promise<AxiosResponse>;

		let headers: { [p: string]: string } = {};
		if (this.format !== BodyFormat.None) headers["Content-Type"] = this.format === BodyFormat.JSON ? "application/json" : "multipart/form-data"

		switch (this.method) {

			case Method.DELETE:
				response = request.delete(this.url);
				break;
			case Method.POST:
				response = request.post(this.url, this.data, {headers});
				break;
			case Method.PUT:
				response = request.put(this.url, this.data, {headers});
				break;
			case Method.PATCH:
				response = request.patch(this.url, this.data, {headers});
				break;
			case Method.GET:
			default:
				response = request.get(this.url);
				break;
		}
		return await Result.handle(response);
	}

	async call(requestEvent: RequestEvent): Promise<Result> {
		let request = axios.create({params: this.queryData});
		if (this.useAuth) this.config.getAuthDecorators().forEach(decorator => decorator.decorate(request, requestEvent));
		this.config.getDecorators().forEach(decorator => decorator.decorate(request, requestEvent));
		return this.isCached ? await this.sendCachedRequest(request) : this.sendRequest(request);
	}
}
