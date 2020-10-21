export class URLParser {
    static getUrlParam(param: string): string | null {
        const url = new URL(window.location.href);
        return url.searchParams.get(param);
    }

    static setUrlParam(param: string, value: string) {
        const url = new URL(window.location.href);
        url.searchParams.set(param, value);
        window.history.pushState(null, "", url.toString());
    }
}