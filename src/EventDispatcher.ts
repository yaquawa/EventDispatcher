import { isRegexp, isArray } from './TypeGuards';
import { Event } from './Event';

interface EventsMap {
  [eventType: string]: any;
}

interface DefaultEventsMap<E extends Event = Event> {
  [eventType: string]: (event: E) => any;
}

type Keys<T> = Extract<keyof T, string>;

function asArray(value: any): any[] {
  return isArray(value) ? value : [value];
}

class EventDispatcher<Events extends EventsMap = DefaultEventsMap> {
  private readonly validEvents: (string | RegExp)[];
  private callbacks: Partial<{ [E in keyof Events]: Events[E][] }>;
  private disabled: boolean;
  private callbackContext: object;

  /**
   * Create a EventDispatcher instance.
   */
  constructor(validEventTypes: (string | RegExp)[] = [/.*/]) {
    // If provided a array for validate event type set it up.
    // `event-type` could be either a string or regular expression
    this.validEvents = validEventTypes;
    this.callbacks = {};
    this.disabled = false;
    this.callbackContext = this;
  }

  /**
   * Set the context used when triggering callbacks.
   */
  setCallbackContext(context: object): this {
    this.callbackContext = context;

    return this;
  }

  /**
   * Register an event handler function for one or more events.
   *
   * @param eventType
   * One or more event types.
   *
   * @param fn
   * The callback function to be bound.
   */
  on<EventType extends Keys<Events>>(
    eventType: EventType,
    fn: Events[EventType]
  ): this {
    this.validateEventType(eventType);

    // Add fn to callback list
    if (!this.hasCallbacks(eventType)) {
      this.callbacks[eventType] = [];
    }

    this.callbacks[eventType]!.push(fn);

    return this;
  }

  /**
   * Remove the event handler.
   *
   * @param eventType
   * One or more event types.
   *
   * @param fn
   * The callback function to be removed.
   * If not provided, all callback functions of the given event type(s) get removed.
   */
  off<EventType extends Keys<Events>>(
    eventType: EventType,
    fn?: Events[EventType]
  ): this {
    this.validateEventType(eventType);

    // Error handling
    if (!this.hasCallbacks(eventType)) {
      return this;
    }

    // Delete all related callbacks if `fn` not specified
    if (!fn) {
      delete this.callbacks[eventType];
      return this;
    }

    // Otherwise delete only the `fn` from callback list
    const callbacks = this.callbacks[eventType];
    let i = callbacks!.length;
    while (i--) {
      if (callbacks![i] === fn) {
        this.callbacks[eventType]!.splice(i, 1);
      }
    }

    return this;
  }

  /**
   * Similar to `this.on` Define a one time event.
   */
  one<EventType extends Keys<Events>>(
    eventType: EventType,
    fn: Events[EventType]
  ): this {
    this.validateEventType(eventType);

    const callback = (eventObject: Event) => {
      this.off(eventType, callback as Events[EventType]);
      return fn.call(this.callbackContext || this, eventObject);
    };

    this.on(eventType, callback as Events[EventType]);

    return this;
  }

  /**
   * Trigger the given event(s).
   * The arguments passed to the callback function.
   */
  trigger<EventObject extends Event>(
    eventObject: EventObject
  ): ReturnType<Events[keyof Events]>[] | null;
  trigger<EventType extends Keys<Events>>(
    eventType: EventType,
    args?: Record<string, any>
  ): ReturnType<Events[EventType]>[] | null;
  trigger(eventTypeOrEventObject: any, args?: any): any {
    const eventObject =
      eventTypeOrEventObject instanceof Event
        ? eventTypeOrEventObject
        : new Event(eventTypeOrEventObject, { properties: args || {} });
    const eventType =
      eventTypeOrEventObject instanceof Event
        ? eventTypeOrEventObject.type
        : eventTypeOrEventObject;

    this.validateEventType(eventType);

    if (this.disabled || !this.hasCallbacks(eventType)) {
      return null;
    }

    const callbacks = this.callbacksForEvent(eventType);

    const responses = callbacks!.map(callback => {
      return callback.call(this.callbackContext || this, eventObject);
    });

    return responses;
  }

  /**
   * Disable triggering events.
   */
  disable(): this {
    this.disabled = true;
    return this;
  }

  /**
   * Enable triggering events.
   */
  enable(): this {
    this.disabled = false;
    return this;
  }

  /**
   * Get the callbacks for the given event name.
   */
  callbacksForEvent<EventType extends keyof Events>(
    eventType: EventType
  ): Partial<{ [E in keyof Events]: Events[E][] }>[EventType] {
    return this.callbacks[eventType];
  }

  /**
   * Determine if the given event type has callback functions.
   */
  private hasCallbacks(eventType: string): boolean {
    return eventType in this.callbacks;
  }

  /**
   * Throw an error if the given event type(s) is not valid.
   */
  private validateEventType(eventType: string | string[]): void {
    if (!this.isValidEvent(eventType)) {
      const validEvents = this.validEvents.join('|');
      throw new Error(
        `Invalid Event Type: '${eventType}'.\nEvent type should be any of: ${validEvents}.`
      );
    }
  }

  /**
   * Determine if the given event type(s) is(are) valid.
   *
   * @param {(string|string[])} eventType
   * @returns {boolean}
   */
  private isValidEvent(eventType: string | string[]): boolean {
    let validEventCount = 0;
    const eventTypes = asArray(eventType);

    for (let eventType of eventTypes) {
      for (let validEvent of this.validEvents) {
        let isValid;
        if (isRegexp(validEvent)) {
          isValid = validEvent.test(eventType);
        } else {
          isValid = eventType === validEvent;
        }
        if (isValid) {
          validEventCount++;
          if (validEventCount === eventTypes.length) {
            return true;
          }
        }
      }
    }

    return false;
  }

  Api() {
    const ed = this;

    return class {
      eventDispatcher: EventDispatcher<Events>;

      constructor() {
        this.eventDispatcher = ed;
      }

      on<EventType extends Keys<Events>>(
        eventType: EventType,
        fn: Events[EventType]
      ): this {
        this.eventDispatcher.on(eventType, fn);
        return this;
      }

      off<EventType extends Keys<Events>>(
        eventType: EventType,
        fn?: Events[EventType]
      ): this {
        ed.off(eventType, fn);
        return this;
      }

      one<EventType extends Keys<Events>>(
        eventType: EventType,
        fn: Events[EventType]
      ): this {
        ed.one(eventType, fn);
        return this;
      }

      trigger<EventObject extends Event>(
        eventObject: EventObject
      ): ReturnType<Events[keyof Events]>[] | null;
      trigger<EventType extends Keys<Events>>(
        eventType: EventType,
        args?: Record<string, any>
      ): ReturnType<Events[EventType]>[] | null;
      trigger(eventTypeOrEventObject: any, args?: any): any {
        ed.trigger(eventTypeOrEventObject, args);
        return this;
      }
    };
  }
}

export { EventDispatcher, DefaultEventsMap, Event };
