import { EventInterface } from './Event'

export function isArray<T = any>(obj: any): obj is Array<T> {
  if (Array.isArray) {
    return Array.isArray(obj)
  }
  return Object.prototype.toString.call(obj) === '[object Array]'
}

export function isRegexp(obj: any): obj is RegExp {
  return Object.prototype.toString.call(obj) === '[object RegExp]'
}

export function isFunction<T = Function>(obj: any): obj is T {
  return typeof obj === 'function'
}

export function isString(obj: any): obj is string {
  return typeof obj === 'string'
}

export function isEventObject(value: any): value is EventInterface {
  return typeof value === 'object' && 'type' in value
}
