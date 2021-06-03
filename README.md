# EventDispatcher

This is a tiny JavaScript library for implementing an event dispatcher(emitter) with easy.
Written by TypeScript which gives you the power of type checking as well 💖.

![version](https://img.shields.io/npm/v/EventDispatcher) ![license](https://img.shields.io/npm/l/EventDispatcher) ![TypeScript](https://img.shields.io/badge/</>-TypeScript-blue.svg)


## Installation
Install the package via npm

```shell script
npm i EventDispatcher
```


## Basic Usage

```js
import { EventDispatcher } from 'EventDispatcher';

/*
|---------------------------------------------------------------------------
| Create a EventDispatcher instance.
|---------------------------------------------------------------------------
| Create a event dispatcher by giving your valid event type names.
| Either literal string or regular expression are allowed.
| If omitted, it'll match any event type names. 
|
*/

const myEventTypes = ['click', 'move', 'touch'];
const ed = new EventDispatcher({ validEventTypes: myEventTypes });



/*
|---------------------------------------------------------------------------
| Register an event handler
|---------------------------------------------------------------------------
| Register an event handler by calling the methods `on|one`
|
*/

// Register an event handler.
ed.on('click', function (event) {
    console.log(event.type);
});

// Register an event handler which only will be dispatched one time.
const touchEventHandler = () => {
    console.log('touched!');
};

ed.one('touch', touchEventHandler);



/*
|---------------------------------------------------------------------------
| Trigger events
|---------------------------------------------------------------------------
| Trigger any events by calling the `trigger` method. 
|
*/

// Trigger an event with event object
const eventObject = {
    'arg1': 'foo',
    'arg2': 'bar'
};

ed.trigger('click', eventObject);

// without event object
ed.trigger('touch');



/*
|---------------------------------------------------------------------------
| Remove events
|---------------------------------------------------------------------------
| Remove the event by calling the `remove` method.  
|
*/

// Remove all the handlers of an event
ed.off('click');

// Remove a specific handler of an event
ed.off('touch', touchEventHandler);



/*
|---------------------------------------------------------------------------
| Enable and Disable the event dispatcher temporally.
|---------------------------------------------------------------------------
| You can enable or disable the event dispatcher temporally by calling 
| the `enable()` and `disable()` methods.
|
*/
ed.disable().trigger('click'); // nothing got triggered
ed.enable().trigger('click'); // enable it again, now it triggers the callbacks



/*
|---------------------------------------------------------------------------
| Event type validation
|---------------------------------------------------------------------------
| The dispatcher checks the event name passed to the methods `on|one|off|trigger`.
| It'll throw an error if the event type name not matched to the `validEventTypes`
| where you have specified in the constructor. 
|
*/

// These code will throw an error because the `foo` is not a valid event type 
// which was defined in the variable `myEventTypes`.
ed.on('foo',() => {})
ed.off('foo')
ed.trigger('foo')
```

## "unbind" event handler
There is a special way to remove event listener, which can be used in some special design patterns.

```js
const eventHandler = () => {}
const off = ed.on('foo', eventHandler)

off() // equivalent to `ed.off('foo', eventHandler)`
```

## Catch previous triggered event
You can catch the previous already triggered event by passing a third option parameter to the `on` method.

```js
const mouseEvent = new MouseEvent('click')

ed.trigger('click', mouseEvent)

// The event handler will be called immediately. 
ed.on('click', clickEventHandler, { triggerLastEvent: true })
```


## Use it as a mixin
You can mixin the APIs into another class by extending the API class.

```js
class Foo extends ed.Api() {

}

const foo = new Foo;

foo.trigger('click');
```

If you have a base class already, I would recommend you to use [ts-mixer](https://github.com/tannerntannern/ts-mixer) to make it possible.   
In that case your code would be: 

```js
import { Mixin } from 'ts-mixer';

class Foo extends Mixin(BaseClass,ed.Api()) {

}

const foo = new Foo;

foo.trigger('click');
```


## TypeScript
Leverage TypeScript for strict typing and compilation by giving an event interface.

```ts
import {EventDispatcher, Event} from 'EventDispatcher';

interface Events {
  click(event: MouseEvent): void
  touch(event: Event): boolean
}

class MouseEvent extends Event {
  public timeStamp: number

  constructor(type: string) {
    super(type);
    this.timeStamp = (new Date).getTime();
  }
}

const ed = new EventDispatcher<Events>({ validEventTypes: ['click', 'touch'] });

ed.on('foo',() => {}) // error
ed.off('foo',() => {}) // error
ed.trigger('foo') // error
ed.on('click',() => {}) // OK
ed.off('click',() => {}) // OK
ed.trigger('click') // OK

ed.on('touch',() => 10) // error
ed.on('touch',() => true) // OK

ed.trigger('touch',10) // error
ed.trigger('touch',{foo:'bar'}) // OK
ed.trigger(new MouseEvent('click')) // OK
```

## API
For more information just take a look at the [test file](https://github.com/yaquawa/EventDispatcher/blob/master/tests/EventDispatcher.test.ts).
