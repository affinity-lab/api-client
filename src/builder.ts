import type CacheInterface from "./cache-interface";
import type {RequestEvent} from "@sveltejs/kit";
import Client, {type IClient, type IClientWithBody, type IClientWithCache} from "./client";
import type {Axios} from "axios";
import {BodyFormat, Method, type ResultType} from "./types";

export interface Decorator {
	decorate(axios: Axios, requestEvent: RequestEvent): void;
}

export default class ApiBuilder {

	private readonly decorators: Decorator[] = [];
	private cacheService?: CacheInterface;
	private authDecorators: Decorator[] = [];
	private readonly baseUrl: string;

	addAuthDecorator(decorator: Decorator) {this.authDecorators.push(decorator);}
	getAuthDecorators(): Decorator[] {return this.authDecorators;}
	setCacheService(cacheService: CacheInterface) {this.cacheService = cacheService;}
	getCacheService(): CacheInterface | undefined {return this.cacheService;}
	addDecorator(decorator: Decorator) {this.decorators.push(decorator)}
	getDecorators(): Decorator[] {return this.decorators}

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl.replace(/\/+$/, '')
	}

	private compose(
		path: string,
		method: Method,
		options: { auth?: boolean, cache?: boolean, format?: BodyFormat } = {}
	): Client {
		options = Object.assign({auth: false, cache: false, format: BodyFormat.None}, options)
		return new Client(
			this.baseUrl + '/' + path.replace(/^\/+/, ''),
			method,
			options.auth!,
			options.cache!,
			options.format!,
			this
		);
	}

	get = <R = ResultType>(path: string): IClient<R> & IClientWithCache => this.compose(path, Method.GET, {cache: true})
	delete = <R = ResultType>(path: string): IClient<R> => this.compose(path, Method.DELETE)
	post = <R = ResultType>(path: string): IClient<R> => this.compose(path, Method.POST)
	put = <R = ResultType>(path: string): IClient<R> => this.compose(path, Method.PUT)
	patch = <R = ResultType>(path: string): IClient<R> => this.compose(path, Method.PATCH)

	json = {
		post: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.POST, {format: BodyFormat.JSON}),
		put: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.PUT, {format: BodyFormat.JSON}),
		patch: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.PATCH, {format: BodyFormat.JSON})
	}
	form = {
		post: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.POST, {format: BodyFormat.FormData}),
		put: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.PUT, {format: BodyFormat.FormData}),
		patch: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.PATCH, {format: BodyFormat.FormData})
	}

	auth = {
		get: <R = ResultType>(path: string): IClient<R> => this.compose(path, Method.GET, {auth: true}),
		delete: <R = ResultType>(path: string): IClient<R> => this.compose(path, Method.DELETE, {auth: true}),
		post: <R = ResultType>(path: string): IClient<R> => this.compose(path, Method.POST, {auth: true}),
		put: <R = ResultType>(path: string): IClient<R> => this.compose(path, Method.PUT, {auth: true}),
		patch: <R = ResultType>(path: string): IClient<R> => this.compose(path, Method.PATCH, {auth: true}),
		json: {
			post: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.POST, {auth: true, format: BodyFormat.JSON}),
			put: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.PUT, {auth: true, format: BodyFormat.JSON}),
			patch: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.PATCH, {auth: true, format: BodyFormat.JSON})
		},
		form: {
			post: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.POST, {auth: true, format: BodyFormat.FormData}),
			put: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.PUT, {auth: true, format: BodyFormat.FormData}),
			patch: <R = ResultType>(path: string): IClient<R> & IClientWithBody => this.compose(path, Method.PATCH, {auth: true, format: BodyFormat.FormData})
		}
	}
}