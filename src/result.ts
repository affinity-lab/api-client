import {AxiosError, type AxiosResponse} from "axios";
import {type ActionFailure, fail} from "@sveltejs/kit";

export default class Result<R = any> {

	constructor(private success: boolean, private responseStatus: number | undefined, private responseData: any, private headers?: { [p: string]: any }) {}
	get error(): AxiosError { return this.success ? undefined : this.responseData}
	get data(): R { return this.success ? this.responseData : undefined;}
	get status(): number { return this.responseStatus === undefined ? 0 : this.responseStatus;}
	get isSuccess(): boolean {return this.success;}
	get isFailure(): boolean {return !this.success;}
	getHeader(key: string): string | undefined {
		if (this.headers === undefined) return undefined;
		return this.headers[key];
	}

	onSuccess(handler: (result: Result) => void): this;
	onSuccess(status: number | Array<number>, handler: (result: Result) => void): this;
	onSuccess(p1: unknown, p2: unknown = undefined): this {
		if (this.isSuccess) {
			let handler: (result: Result) => void;
			let status: Set<number> | null;
			if (p2 !== undefined) {
				handler = p2 as (result: Result) => void;
				status = typeof p1 === "number" ? new Set([p1]) : new Set(p1 as Array<number>);
			} else {
				handler = p1 as (result: Result) => void;
				status = null;
			}
			if (status === null || status.has(this.status)) handler(this);
		}
		return this;
	}

	onFailure(handler: (result: Result) => void): this;
	onFailure(status: number | Array<number>, handler: (result: Result) => void): this;
	onFailure(p1: unknown, p2: unknown = undefined): this {
		if (this.isFailure) {
			let handler: (result: Result) => void;
			let status: Set<number> | null;
			if (p2 !== undefined) {
				handler = p2 as (result: Result) => void;
				status = typeof p1 === "number" ? new Set([p1]) : new Set(p1 as Array<number>);
			} else {
				handler = p1 as (result: Result) => void;
				status = null;
			}
			if (status === null || status.has(this.status)) handler(this);
		}
		return this;
	}

	evaluate(): R | ActionFailure<Record<string, unknown> | undefined> {return this.isSuccess ? this.data : fail(this.status);}

	static async handle(response: Promise<AxiosResponse>): Promise<Result> {
		return await response
			.then(res =>{
				return new Result(true, res.status, res.data, res.headers)
			})
			.catch(error => {
				if (error instanceof AxiosError) {
					return new Result(false, error.response?.status, error, error.response?.headers)
				} else {
					throw error;
				}
			});
	}
}