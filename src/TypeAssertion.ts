import { isArray, isFunction, isRegexp, isString } from './TypeGuards';

const assert = {
  array<T = any>(array: any): Array<T> {
    if (isArray<T>(array)) {
      return array;
    }
    throw new TypeError('Value should be an Array.');
  },
  func<T = Function>(func: any): T {
    if (isFunction<T>(func)) {
      return func;
    }
    throw new TypeError('Value should be a function.');
  },
  string(string: any): string {
    if (isString(string)) {
      return string;
    }
    throw new TypeError('Value should be a string.');
  },
  regexp(regexp: any): RegExp {
    if (isRegexp(regexp)) {
      return regexp;
    }
    throw new TypeError('Value should be a RegExp.');
  },
};

export { assert };
