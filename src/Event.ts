export type EventInit = {
  properties?: Record<string, any>
}

const defaultEventInit = {
  properties: {},
}

export type EventInterface = { readonly type: string }

export class Event implements EventInterface {
  public readonly type: string

  constructor(type: string, options?: EventInit) {
    const mergedOptions = { ...defaultEventInit, ...options }
    this.type = type
    this.defineProperties(mergedOptions.properties)
  }

  protected defineProperties(properties: Record<string, any>) {
    for (const property in properties) {
      ;(this as any)[property] = properties[property]
    }
  }
}
