import { EventDispatcher, AnyEvents } from '../src/EventDispatcher';

interface Events {
  click: (...args: any[]) => any;
  touch: (...args: any[]) => any;

  sentResponse(response: string): void;

  getPostTitle(title: string, post: object): void | string;
}

const ed = new EventDispatcher<Events>([
  'click',
  'touch',
  'sentResponse',
  'getPostTitle',
]);

test('register and trigger event', () => {
  const argsPassed = ['arg1', 'arg2'];
  const callback = jest.fn();

  ed.on('click', callback)
    .on('touch', callback)
    .one('touch', callback);

  ed.trigger('click', ...argsPassed);
  expect(callback).nthCalledWith(1, ...[...argsPassed, { type: 'click' }]);

  ed.trigger('touch', ...argsPassed);
  expect(callback).nthCalledWith(2, ...[...argsPassed, { type: 'touch' }]);
  expect(callback).nthCalledWith(3, ...[...argsPassed, { type: 'touch' }]);

  ed.trigger(['touch', 'click'], ...argsPassed);
  expect(callback).nthCalledWith(4, ...[...argsPassed, { type: 'touch' }]);
  expect(callback).nthCalledWith(5, ...[...argsPassed, { type: 'click' }]);

  expect(callback).toBeCalledTimes(5);
});

test('register event with regular expression', () => {
  const callback = jest.fn();
  const ed = new EventDispatcher([/click/]);

  expect(() => {
    ed.on('clickFoo', callback);
  }).not.toThrow();

  expect(() => {
    ed.on('Foo', callback);
  }).toThrow();
});

test('register onetime event', () => {
  const callback = jest.fn();

  ed.one('click', callback);

  ed.trigger('click', []);
  ed.trigger('click');

  expect(callback).toBeCalledTimes(1);
});

describe('remove the callbacks', () => {
  test('with callback specified', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    ed.on('click', callback1)
      .on('click', callback2)
      .off('click', callback1)
      .trigger('click');

    expect(callback1).not.toBeCalled();
    expect(callback2).toBeCalled();
  });

  test('with callback not specified, removes all the callbacks of the given event type', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    ed.on('click', callback1)
      .on('click', callback2)
      .off('click')
      .trigger('click');

    expect(callback1).not.toBeCalled();
    expect(callback2).not.toBeCalled();
  });
});

test('throws if the event type is not valid', () => {
  const callback = jest.fn();

  expect(() => {
    ed.on('foo' as 'click', callback);
  }).toThrow();

  expect(() => {
    ed.one('foo' as 'click', callback);
  }).toThrow();

  expect(() => {
    ed.trigger('foo' as 'click');
  }).toThrow();

  expect(() => {
    ed.off('foo' as 'click');
  }).toThrow();
});

test('disable or enable the event dispatcher', () => {
  const callback = jest.fn();

  ed.on('click', callback)
    .disable()
    .trigger('click');

  expect(callback).not.toBeCalled();

  ed.enable().trigger('click');
  expect(callback).toBeCalled();
});

test('set callback context', () => {
  const context = {};

  ed.one('click', function(this: any) {
    expect(this).toEqual(ed);
  }).trigger('click');

  ed.setCallbackContext(context)
    .one('click', function(this: any) {
      expect(this).toEqual(context);
    })
    .trigger('click');
});

test('mixin to another class', () => {
  class BaseClass {}

  const response = 'hello world!';

  for (let Api of [ed.mixin(BaseClass)]) {
    let MixedClass = class extends Api {
      listenSentResponse() {
        this.on('sentResponse', (res: string) => {
          expect(res).toEqual(response);
        });
      }
    };

    let mixedObj = new MixedClass();
    mixedObj.listenSentResponse();
    mixedObj.trigger('sentResponse', response);
  }
});
