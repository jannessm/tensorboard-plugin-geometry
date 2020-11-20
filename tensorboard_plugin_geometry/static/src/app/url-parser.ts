interface URLParams {
    [key: string]: string | undefined;
}


export class URLParser {
    static getUrlParam(param: string): string | undefined {
        const url = new URL(window.parent.location.href);
        const params = URLParser._parseHash(url.hash);

        const value = params[param];

        if (typeof value === 'string') {
            return decodeURIComponent(value);
        }

        return value;
    }

    static setUrlParam(param: string, value: string) {
        const url = new URL(window.parent.location.href);
        const params = URLParser._parseHash(url.hash);

        if (params[param] !== value) {
            params[param] = encodeURIComponent(value);
    
            url.hash = URLParser._paramsToHash(params);
    
            window.parent.history.pushState(null, "", url.toString());
        }
    }

    static _parseHash(hash: string): URLParams {
        const paramMap = {};
        const params = hash.split('&');
        
        params.forEach(val => {
            if (!val.startsWith('#')) {
                const keyVal = val.split('=');
                paramMap[keyVal[0]] = keyVal[1] || '';
            }
        });

        return paramMap;
    }

    static _paramsToHash(params: URLParams): string {
        return '#geometries&' + Object.keys(params).map(key => key += '=' + params[key]).join('&');
    }
}