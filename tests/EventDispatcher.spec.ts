import { EventDispatcher, Event } from '../src'
import { Mixin } from 'ts-mixer'
import fn = jest.fn

class MouseEvent extends Event {
  public timeStamp: number

  constructor(type: string) {
    super(type)
    this.timeStamp = new Date().getTime()
  }
}

interface Events {
  // [eventType: string]: (event: EventX) => any
  click(event: MouseEvent): void

  touch(event: MouseEvent): boolean
}

let ed: EventDispatcher<Events>

beforeEach(() => {
  ed = new EventDispatcher<Events>({ validEventTypes: ['click', 'touch', 'sentResponse', 'getPostTitle'] })
})

test('register and trigger event', () => {
  const args = { arg1: 'foo', arg2: 'bar' }
  const callback = jest.fn()

  ed.on('click', callback)
  ed.on('touch', callback)
  ed.one('touch', callback)

  ed.trigger('click', args)
  expect(callback).nthCalledWith(1, { type: 'click', ...args })

  ed.trigger('touch', args)
  expect(callback).nthCalledWith(2, { type: 'touch', ...args })
  expect(callback).nthCalledWith(3, { type: 'touch', ...args })

  expect(callback).toBeCalledTimes(3)
})

test('trigger method return response array', () => {
  ed.on('touch', () => {
    return true
  })
  ed.on('touch', () => {
    return false
  })

  const responses = ed.trigger('touch')

  expect(responses).toEqual([true, false])
})

test('register event with regular expression', () => {
  const callback = jest.fn()
  const ed = new EventDispatcher({ validEventTypes: [/click/] })

  expect(() => {
    ed.on('clickFoo', callback)
  }).not.toThrow()

  expect(() => {
    ed.on('Foo', callback)
  }).toThrow()
})

test('register onetime event', () => {
  const callback = jest.fn()

  ed.one('click', callback)

  ed.trigger('click', [])
  ed.trigger('click')

  expect(callback).toBeCalledTimes(1)
})

describe('remove the callbacks', () => {
  test('with callback specified', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const callback3 = jest.fn()

    ed.on('click', callback1)
    const off = ed.on('click', callback2)
    ed.on('click', callback3)

    ed.off('click', callback1)
    off()

    ed.trigger('click')

    expect(callback1).not.toBeCalled()
    expect(callback2).not.toBeCalled()
    expect(callback3).toBeCalled()
  })

  test('with callback not specified, removes all the callbacks of the given event type', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()

    ed.on('click', callback1)
    ed.on('click', callback2)
    ed.off('click')

    ed.trigger('click')

    expect(callback1).not.toBeCalled()
    expect(callback2).not.toBeCalled()
  })
})

test('throws if the event type is not valid', () => {
  const callback = jest.fn()

  expect(() => {
    ed.on('foo' as 'click', callback)
  }).toThrow()

  expect(() => {
    ed.one('foo' as 'click', callback)
  }).toThrow()

  expect(() => {
    ed.trigger('foo' as 'click')
  }).toThrow()

  expect(() => {
    ed.off('foo' as 'click')
  }).toThrow()
})

test('disable or enable the event dispatcher', () => {
  const callback = jest.fn()

  ed.on('click', callback)
  ed.disable().trigger('click')

  expect(callback).not.toBeCalled()

  ed.enable().trigger('click')
  expect(callback).toBeCalled()
})

test('set callback context', () => {
  const context = {}

  ed.one('click', function (this: any) {
    expect(this).toEqual(ed)
  })
  ed.trigger('click')

  ed.setCallbackContext(context).one('click', function (this: any) {
    expect(this).toEqual(context)
  })
  ed.trigger('click')
})

test('store and trigger last event object', () => {
  const mouseEvent = new MouseEvent('click')
  const clickEventHandler = jest.fn()

  ed.trigger('click', mouseEvent)
  expect(ed.getLastEventObjectOf('click')).toEqual(mouseEvent)

  ed.on('click', clickEventHandler, { triggerLastEvent: true })
  expect(clickEventHandler).toHaveBeenCalledTimes(1)
  expect(clickEventHandler).toHaveBeenCalledWith(mouseEvent)

  ed.removeLastEventObjectOf('click')
  expect(ed.getLastEventObjectOf('click')).toEqual(null)
})

test('clear all callbacks', () => {
  const callback = jest.fn()

  ed.on('click', callback)
  ed.on('touch', callback)

  ed.clear()

  ed.trigger('click')
  ed.trigger('touch')

  expect(callback).toHaveBeenCalledTimes(0)
})

test('mixin to another class', () => {
  class BaseClass {}

  const response = { foo: 'foobar' }

  class MixedClass extends Mixin(BaseClass, ed.Api()) {
    listenSentResponse() {
      this.on('touch', (e) => {
        expect(e).toEqual({ ...response, type: 'touch' })
        return false
      })
    }
  }

  const mixedObj = new MixedClass()
  mixedObj.listenSentResponse()
  mixedObj.trigger('touch', response)
})
