import type {Decorator} from "./builder";
import type {Axios} from "axios";
import type {RequestEvent} from "@sveltejs/kit";
import type {AxiosResponseHeaders} from "axios/index";

export class AuthorizationHeader implements Decorator {
	private readonly config = {
		header: "Authorization",
		cookie: "auth-token",
		prefixAuthToken: (token: string) => `Bearer ${token}`
	}

	constructor(config: { header?: string, cookie?: string, prefixAuthToken?: (token: string) => string } = {}) {
		this.config = Object.assign(this.config, config)
	}
	decorate(axios: Axios, requestEvent: RequestEvent): void {
		axios.interceptors.request.use((config) => {
			let authToken = requestEvent.cookies.get(this.config.cookie);
			if (typeof authToken === "string") config.headers.set(this.config.header, this.config.prefixAuthToken(authToken));
			return config;
		});
		axios.interceptors.response.use((response) => {
			if (response.status === 401) requestEvent.cookies.delete(this.config.cookie, {path:"/"});
			return response;
		});
	}
}

export class AutoRefresh implements Decorator {
	private readonly config = {
		refreshTokenCookie: "refresh-token",
		authTokenCookie: "auth-token",
		sendRefreshInHeader: "x-Refresh-Token",
		receiveAuthToken: "x-Set-Auth-Token",
		receiveRefreshToken: "x-Set-Refresh-Token",
	};
	constructor(config: { refreshTokenCookie?: string, authTokenCookie?: string, sendRefreshInHeader?: string, receiveAuthToken?: string, receiveRefreshToken?: string } = {}) {
		this.config = Object.assign(this.config, config)
	}
	decorate(axios: Axios, requestEvent: RequestEvent): void {
		axios.interceptors.request.use((config) => {
			let refreshToken = requestEvent.cookies.get(this.config.refreshTokenCookie);
			if (typeof refreshToken === "string") config.headers.set(this.config.sendRefreshInHeader, refreshToken);
			return config;
		});
		axios.interceptors.response.use((response) => {
			let headers = response.headers as AxiosResponseHeaders;
			if (response.status !== 401) {
				if (headers.has(this.config.receiveAuthToken)) requestEvent.cookies.set(this.config.authTokenCookie, headers.get(this.config.receiveAuthToken)!.toString(), {path:"/"});
				if (headers.has(this.config.receiveRefreshToken)) requestEvent.cookies.set(this.config.refreshTokenCookie, headers.get(this.config.receiveRefreshToken)!.toString(), {path:"/"});
			}
			return response;
		});
	}
}

export class AddHeader implements Decorator {
	constructor(private key: string, private value: string) {}
	public decorate(axios: Axios, requestEvent: RequestEvent): void {
		axios.interceptors.request.use(config => {
			config.headers.set(this.key, this.value)
			return config;
		})
	}
}