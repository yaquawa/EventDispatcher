function isArray<T = any>(obj: any): obj is Array<T> {
    if (Array.isArray) {
        return Array.isArray(obj);
    }
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function isRegexp(obj: any): obj is RegExp {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
}

function isFunction<T = Function>(obj: any): obj is T {
    return typeof obj === 'function';
}

function isString(obj: any): obj is string {
    return typeof obj === 'string';
}


export {isArray, isRegexp, isFunction, isString};