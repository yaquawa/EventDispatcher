import { EventDispatcher, Event } from '../src'
import { Mixin } from 'ts-mixer'

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
  ed = new EventDispatcher<Events>(['click', 'touch', 'sentResponse', 'getPostTitle'])
})

test('register and trigger event', () => {
  const args = { arg1: 'foo', arg2: 'bar' }
  const callback = jest.fn()

  ed.on('click', callback).on('touch', callback).one('touch', callback)

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
  }).on('touch', () => {
    return false
  })

  const responses = ed.trigger('touch')

  expect(responses).toEqual([true, false])
})

test('register event with regular expression', () => {
  const callback = jest.fn()
  const ed = new EventDispatcher([/click/])

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

    ed.on('click', callback1).on('click', callback2).off('click', callback1).trigger('click')

    expect(callback1).not.toBeCalled()
    expect(callback2).toBeCalled()
  })

  test('with callback not specified, removes all the callbacks of the given event type', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()

    ed.on('click', callback1).on('click', callback2).off('click').trigger('click')

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

  ed.on('click', callback).disable().trigger('click')

  expect(callback).not.toBeCalled()

  ed.enable().trigger('click')
  expect(callback).toBeCalled()
})

test('set callback context', () => {
  const context = {}

  ed.one('click', function (this: any) {
    expect(this).toEqual(ed)
  }).trigger('click')

  ed.setCallbackContext(context)
    .one('click', function (this: any) {
      expect(this).toEqual(context)
    })
    .trigger('click')
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
