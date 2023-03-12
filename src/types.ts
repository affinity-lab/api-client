import type {Axios} from "axios/index";
import type {RequestEvent} from "@sveltejs/kit";

export type Dict = { [p: string]: any }

export type ResultType<T = Dict> = Dict & T | any;

export enum BodyFormat { JSON, FormData, None = -1 }

export enum Method { GET = "GET", POST = "POST", DELETE = "DELETE", PUT = "PUT", PATCH = "PATCH"}

export interface Decorator {decorate(axios: Axios, requestEvent: RequestEvent): void;}