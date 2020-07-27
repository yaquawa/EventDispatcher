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
import {EventDispatcher} from 'EventDispatcher';

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
const ed = new EventDispatcher(myEventTypes);



/*
|---------------------------------------------------------------------------
| Register an event handler
|---------------------------------------------------------------------------
| Register an event handler by calling the methods `on|one`
|
*/

// Register an event handler.
ed.on('click touch', function (arg1, arg2, event) {
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
| Trigger one or more events by calling the `trigger` method. 
|
*/

// Trigger an event  
ed.trigger('click', ['arg1', 'arg2']);

// Trigger multiple events
ed.trigger(['click','touch'], ['arg1', 'arg2']);



/*
|---------------------------------------------------------------------------
| Trigger events
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
ed.disable().trigger(['move','touch']); // nothing got triggered
ed.enable().trigger('move'); // enable it again, now it triggers the callbacks



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


## Use it as a mixin
You can mixin the APIs into another class via calling the `mixin` method of the EventDispatcher instance.

```js
class Foo extends ed.mixin(BaseClass) {

}

const foo = new Foo;

foo.trigger('click');
```


## TypeScript
Leverage TypeScript for strict typing and compilation by giving an event interface.

```ts
interface Events {
    sentResponse(response: string): void
    getPostTitle(title: string, post: object): void | string
}

const ed = new EventDispatcher<Events>(['sentResponse', 'getPostTitle']);

ed.on('foo',() => {}) // error
ed.off('foo',() => {}) // error
ed.trigger('foo',() => {}) // error
ed.on('click',() => {}) // OK
ed.off('click',() => {}) // OK
ed.trigger('click') // OK

ed.on('getPostTitle',() => 10) // error
ed.on('getPostTitle',() => '10') // OK

ed.trigger('getPostTitle',10) // error
ed.trigger('getPostTitle','10',{}) // OK
```

## API
For more information just take a look at the test file.
