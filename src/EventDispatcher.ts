import {isRegexp, isArray} from './TypeGuards';

interface EventsMap {
    [event: string]: any
}

interface AnyEvents {
    [event: string]: (...args: any[]) => any
}

type Constructor<T = {}> = new (...args: any[]) => T;

function asArray(value: any): any[] {
    return isArray(value) ? value : [value];
}


class EventDispatcher<Events extends EventsMap = AnyEvents> {
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
    on<EventType extends keyof Events>(eventType: EventType | EventType[], fn: Events[EventType]): this {
        this.forEachEventType(eventType, (type: keyof Events) => {
            // Add fn to callback list
            if (!this.hasCallbacks(type as string)) {
                this.callbacks[type] = [];
            }
            this.callbacks[type]!.push(fn);
        });

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
    off<EventType extends keyof Events>(eventType: EventType | EventType[], fn?: Events[EventType]): this {
        this.forEachEventType(eventType, (type: keyof Events) => {
            // Error handling
            if (!this.hasCallbacks(type as string)) {
                return;
            }

            // Delete all related callbacks if `fn` not specified
            if (!fn) {
                delete this.callbacks[type];
                return;
            }

            // Otherwise delete only the `fn` from callback list
            const callbacks = this.callbacks[type];
            let i = callbacks!.length;
            while (i--) {
                if (callbacks![i] === fn) {
                    this.callbacks[type]!.splice(i, 1);
                }
            }
        });

        return this;
    }

    /**
     * Similar to `this.on` Define a one time event.
     */
    one<EventType extends keyof Events>(eventType: EventType | EventType[], fn: Events[EventType]): this {
        this.forEachEventType(eventType, (type: keyof Events) => {
            const callback = (...args: any[]) => {
                this.off(type, callback as Events[EventType]);
                return fn.apply((this.callbackContext || this), args);
            };

            this.on(type, callback as Events[EventType]);
        });

        return this;
    }

    /**
     * Trigger the given event(s).
     * @param eventType
     * One or more event types.
     *
     * @param args
     * The arguments passed to the callback function.
     */
    trigger<EventType extends keyof Events>(eventType: EventType | EventType[], ...args: Parameters<Events[EventType]>): this {
        if (this.disabled) {
            return this;
        }

        // args = assert.array(args);

        this.forEachEventType(eventType, (type: keyof Events) => {
            if (!this.hasCallbacks(type as string)) {
                return;
            }

            const callbacks = this.callbacksForEvent(type),
                eventObject = {type: type};

            callbacks!.forEach((callback) => {
                callback.apply((this.callbackContext || this), args.concat(eventObject));
            });
        });

        return this;
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
    callbacksForEvent<EventType extends keyof Events>(eventType: EventType): Partial<{ [E in keyof Events]: Events[E][] }>[EventType] {
        return this.callbacks[eventType];
    }

    /**
     * Determine if the given event type has callback functions.
     */
    private hasCallbacks(eventType: string): boolean {
        return eventType in this.callbacks;
    }


    /**
     * Iterate the given events with validation.
     */
    private forEachEventType<EventType extends keyof Events>(eventType: EventType | EventType[], callback: (type: keyof Events) => void): void {
        const eventTypes = asArray(eventType);

        this.validateEventType(eventTypes);

        eventTypes.forEach((type: keyof Events) => {
            callback.call(this, type);
        });
    }

    /**
     * Throw an error if the given event type(s) is not valid.
     */
    private validateEventType(eventType: string | string[]): void {
        if (!this.isValidEvent(eventType)) {
            throw new Error(`Invalid Event Type: '${eventType}'.\nEvent type should be any of: ${this.validEvents.join('|')}.`);
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


    mixin<T extends Constructor>(BaseClass: T) {
        const ed = this;

        return class extends BaseClass {
            eventDispatcher: EventDispatcher<Events>;

            constructor(...args: any[]) {
                super(...args);
                this.eventDispatcher = ed;
            }

            on<EventType extends keyof Events>(eventType: EventType | EventType[], fn: Events[EventType]): this {
                this.eventDispatcher.on(eventType, fn);
                return this;
            }

            off<EventType extends keyof Events>(eventType: EventType | EventType[], fn?: Events[EventType]): this {
                ed.off(eventType, fn);
                return this;
            }

            trigger<EventType extends keyof Events>(eventType: EventType | EventType[], ...args: Parameters<Events[EventType]>): this {
                ed.trigger(eventType, ...args);
                return this;
            }
        };
    }

}


export {EventDispatcher, AnyEvents};