import { EventInterface, Event } from './Event'
import { isRegexp, isArray, isEventObject } from './TypeGuards'

type BaseEventsMap<E extends EventInterface = EventInterface> = {
  [eventType: string]: (event: E) => any
}

type Keys<T> = Extract<keyof T, string>

type OffEvent = () => void
type Options = {
  validEventTypes?: (string | RegExp)[]
  triggerLastEvent?: boolean
}

type GetFirstParameter<Func extends (...args: any) => any> = Parameters<Func>[0]
type GetObjectValues<T extends Record<string, any>> = T[keyof T]
type GetEventObjects<EventsMap extends Record<string, any>> = GetFirstParameter<GetObjectValues<EventsMap>>

export class EventDispatcher<EventsMap extends Record<string, any> = BaseEventsMap> {
  private readonly validEventTypes: (string | RegExp)[]
  private callbacks: { [EventType in keyof EventsMap]: Set<EventsMap[EventType]> } = {} as any
  private lastEvents: { [EventType in keyof EventsMap]: GetFirstParameter<EventsMap[EventType]> } = {} as any
  private disabled: boolean = false
  private callbackContext: object
  private triggerLastEvent: boolean

  /**
   * Create a EventDispatcher instance.
   */
  constructor({ validEventTypes = [/.*/], triggerLastEvent = false }: Options = {}) {
    // If provided a array for validate event type set it up.
    // `event-type` could be either a string or regular expression
    this.validEventTypes = validEventTypes
    this.triggerLastEvent = triggerLastEvent
    this.callbackContext = this
  }

  /**
   * Set the context used when triggering callbacks.
   */
  setCallbackContext(context: object): this {
    this.callbackContext = context

    return this
  }

  /**
   * Register an event handler function for one or more events.
   *
   * @param eventType
   * One or more event types.
   *
   * @param callback
   * The callback function to be bound.
   *
   * @param options
   * triggerLastEvent: If set to true, trigger the callback immediately if there is a last event object.
   */
  on<EventType extends Keys<EventsMap>>(
    eventType: EventType,
    callback: EventsMap[EventType],
    options?: { triggerLastEvent?: boolean }
  ): OffEvent {
    this.validateEventType(eventType)

    const triggerLastEvent = options?.triggerLastEvent || this.triggerLastEvent

    // Add fn to callback list
    if (!this.hasCallbacks(eventType)) {
      this.callbacks[eventType] = new Set()
    }

    this.callbacks[eventType].add(callback)

    if (triggerLastEvent) {
      const lastEventObject = this.getLastEventObjectOf(eventType)
      lastEventObject && callback.call(this.callbackContext || this, lastEventObject)
    }

    const off = () => {
      this.off(eventType, callback)
    }

    return off
  }

  /**
   * Remove the event handler.
   *
   * @param eventType
   * One or more event types.
   *
   * @param callback
   * The callback function to be removed.
   * If not provided, all callback functions of the given event type(s) get removed.
   */
  off<EventType extends Keys<EventsMap>>(eventType: EventType, callback?: EventsMap[EventType]): this {
    this.validateEventType(eventType)

    // Error handling
    if (!this.hasCallbacks(eventType)) {
      return this
    }

    // Delete all related callbacks if `callback` not specified
    if (!callback) {
      delete this.callbacks[eventType]
      return this
    }

    // Otherwise delete only the `callback` from callback list
    this.callbacks[eventType].delete(callback)

    return this
  }

  /**
   * Similar to `this.on` Define a one time event.
   */
  one<EventType extends Keys<EventsMap>>(
    eventType: EventType,
    callback: EventsMap[EventType],
    options?: { triggerLastEvent?: boolean }
  ): OffEvent {
    this.validateEventType(eventType)

    const onetimeCallback = (eventObject: EventInterface) => {
      this.off(eventType, onetimeCallback as EventsMap[EventType])
      return callback.call(this.callbackContext || this, eventObject)
    }

    return this.on(eventType, onetimeCallback as EventsMap[EventType], options)
  }

  /**
   * Trigger the given event(s).
   * The arguments passed to the callback function.
   */
  trigger<EventObject extends GetEventObjects<EventsMap>>(
    eventObject: EventObject
  ): ReturnType<EventsMap[keyof EventsMap]>[] | null
  trigger<EventType extends Keys<EventsMap>>(
    eventType: EventType,
    args?: Record<string, any>
  ): ReturnType<EventsMap[EventType]>[] | null
  trigger(eventTypeOrEventObject: Keys<EventsMap> | EventInterface, args?: Record<string, any>): any {
    const eventObject = isEventObject(eventTypeOrEventObject)
      ? eventTypeOrEventObject
      : new Event(eventTypeOrEventObject, { properties: args || {} })

    const eventType = (isEventObject(eventTypeOrEventObject)
      ? eventTypeOrEventObject.type
      : eventTypeOrEventObject) as Keys<EventsMap>

    this.validateEventType(eventType)

    this.lastEvents[eventType] = eventObject

    if (this.disabled || !this.hasCallbacks(eventType)) {
      return null
    }

    const callbacks = this.callbacksForEvent(eventType)

    const responses = Array.from(callbacks).map((callback) => {
      return callback.call(this.callbackContext || this, eventObject)
    })

    return responses
  }

  getLastEventObjectOf<EventType extends Keys<EventsMap>>(
    eventType: EventType
  ): GetFirstParameter<EventsMap[EventType]> | null {
    if (eventType in this.lastEvents) {
      return this.lastEvents[eventType]
    }

    return null
  }

  removeLastEventObjectOf<EventType extends Keys<EventsMap>>(
    eventType: EventType
  ): GetFirstParameter<EventsMap[EventType]> | null {
    if (eventType in this.lastEvents) {
      const lastEvent = this.lastEvents[eventType]
      delete this.lastEvents[eventType]

      return lastEvent
    }

    return null
  }

  /**
   * Disable triggering events.
   */
  disable(): this {
    this.disabled = true
    return this
  }

  /**
   * Enable triggering events.
   */
  enable(): this {
    this.disabled = false
    return this
  }

  /**
   * Clear all the registered callbacks.
   */
  clear(): this {
    this.callbacks = {} as any

    return this
  }

  /**
   * Get the callbacks for the given event name.
   */
  callbacksForEvent<EventType extends Keys<EventsMap>>(eventType: EventType): Set<EventsMap[EventType]> {
    return this.callbacks[eventType]
  }

  /**
   * Determine if the given event type has callback functions.
   */
  private hasCallbacks(eventType: string): boolean {
    return eventType in this.callbacks
  }

  /**
   * Throw an error if the given event type(s) is not valid.
   */
  private validateEventType(eventType: string | string[]): void {
    if (!this.isValidEvent(eventType)) {
      const validEvents = this.validEventTypes.join('|')
      throw new Error(`Invalid Event Type: '${eventType}'.\nEvent type should be any of: ${validEvents}.`)
    }
  }

  /**
   * Determine if the given event type(s) is(are) valid.
   *
   * @param {(string|string[])} eventType
   * @returns {boolean}
   */
  private isValidEvent(eventType: string | string[]): boolean {
    let validEventCount = 0
    const eventTypes = asArray(eventType)

    for (let eventType of eventTypes) {
      for (let validEvent of this.validEventTypes) {
        let isValid
        if (isRegexp(validEvent)) {
          isValid = validEvent.test(eventType)
        } else {
          isValid = eventType === validEvent
        }
        if (isValid) {
          validEventCount++
          if (validEventCount === eventTypes.length) {
            return true
          }
        }
      }
    }

    return false
  }

  Api() {
    const { validEventTypes, triggerLastEvent } = this
    const createInstance = () => {
      return new EventDispatcher<EventsMap>({ validEventTypes, triggerLastEvent })
    }

    return class {
      eventDispatcher: EventDispatcher<EventsMap>

      constructor() {
        this.eventDispatcher = createInstance()
      }

      on<EventType extends Keys<EventsMap>>(eventType: EventType, fn: EventsMap[EventType]): OffEvent {
        return this.eventDispatcher.on(eventType, fn)
      }

      off<EventType extends Keys<EventsMap>>(eventType: EventType, fn?: EventsMap[EventType]): this {
        this.eventDispatcher.off(eventType, fn)
        return this
      }

      one<EventType extends Keys<EventsMap>>(eventType: EventType, fn: EventsMap[EventType]): OffEvent {
        return this.eventDispatcher.one(eventType, fn)
      }

      trigger<EventObject extends Event>(
        eventObject: EventObject
      ): ReturnType<EventsMap[keyof EventsMap]>[] | null
      trigger<EventType extends Keys<EventsMap>>(
        eventType: EventType,
        args?: Record<string, any>
      ): ReturnType<EventsMap[EventType]>[] | null
      trigger(eventTypeOrEventObject: any, args?: any): any {
        return this.eventDispatcher.trigger(eventTypeOrEventObject, args)
      }
    }
  }
}

function asArray(value: any): any[] {
  return isArray(value) ? value : [value]
}
