/* global serverUrl */
import packageJson from '../package.json' assert {type: 'json'};

import createTestSuite from 'just-tap';
import argsToString from '../lib/argsToString';
import stringToArgs from '../lib/stringToArgs';
import scopeToString from '../lib/scopeToString.js';
import stringToScope from '../lib/stringToScope';
import createWorkerBox from '../lib/index.js';

const { test, run } = createTestSuite({ concurrency: 1 });

test('createWorkerBox with no trailing slash', async (t) => {
  const { options } = await createWorkerBox({ serverUrl: 'https://example.test' });
  t.equal(options.serverUrl, `https://example.test/v${packageJson.version}/`);
});

test('createWorkerBox with trailing slash', async (t) => {
  const { options } = await createWorkerBox({ serverUrl: 'https://example.test/' });
  t.equal(options.serverUrl, `https://example.test/v${packageJson.version}/`);
});

test('createWorkerBox with no options', async (t) => {
  const { options } = await createWorkerBox();
  t.equal(options.serverUrl, null);
});

test('createWorkerBox with empty options', async (t) => {
  const { options } = await createWorkerBox({});
  t.equal(options.serverUrl, null);
});

test('createWorkerBox with appendVersion false', async (t) => {
  const { options } = await createWorkerBox({ serverUrl: 'https://example.test/', appendVersion: false });
  t.equal(options.serverUrl, 'https://example.test/');
});

test('createWorkerBox with appendVersion true', async (t) => {
  const { options } = await createWorkerBox({ serverUrl: 'https://example.test/', appendVersion: true });
  t.equal(options.serverUrl, `https://example.test/v${packageJson.version}/`);
});

test('simple evaluation while using serverUrl', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox({ serverUrl, appendVersion: false });
  const result = await run('return 1 + 1');

  t.equal(result, 2);
});

test('simple evaluation', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox();
  const result = await run('return 1 + 1');

  t.equal(result, 2);
});

test('returning an object with functions on it', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox({ appendVersion: false });
  const returned = await run(`
    return {
      add: (a, b) => a + b
    }
  `);

  const result = await returned.add(1, 1);

  t.deepEqual(result, 2);
});

test('returning an array', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox();
  const result = await run('return [1]');

  t.deepEqual(result, [1], `${result} should equal [1]`);
});

test("returning null", async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox({ appendVersion: false });
  const result = await run("return [1]");

  t.deepEqual(result, [1], `${result} should equal [1]`);
});

test('consecutive runs work', async (t) => {
  t.plan(2);

  const { run } = await createWorkerBox();
  const result1 = await run('return 1');
  const result2 = await run('return 2');

  t.equal(result1, 1, `${result1} should equal 1`);
  t.equal(result2, 2, `${result2} should equal 2`);
});

test('same workerbox instance should share globalThis', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox();
  await run('globalThis.a = 1');
  const result = await run('return globalThis.a');

  t.equal(result, 1);
});

test('same workerbox instance should share self', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox();
  await run('self.a = 1');
  const result = await run('return self.a');

  t.equal(result, 1);
});

test('two workerbox instances do not share globalThis', async (t) => {
  t.plan(2);

  const { run: run1 } = await createWorkerBox();
  const { run: run2 } = await createWorkerBox();
  const result1 = await run1('globalThis.a = 1; return globalThis.a;');
  const result2 = await run2('return globalThis.a');

  t.equal(result1, 1);
  t.equal(result2, null);
});

test('two workerbox instances do not share self', async (t) => {
  t.plan(2);

  const { run: run1 } = await createWorkerBox();
  const { run: run2 } = await createWorkerBox();
  const result1 = await run1('self.a = 1; return self.a;');
  const result2 = await run2('return self.a');

  t.equal(result1, 1);
  t.equal(result2, null);
});

test('destroy works', async (t) => {
  t.plan(1);

  const { run, destroy } = await createWorkerBox();
  const scope = {
    fail: () => t.fail('should not have been called')
  };

  const result = await run('setTimeout(fail, 200); return 1 + 1;', scope);
  destroy();
  t.ok(result === 2, `${result} should equal 2`);
});

test('syntax error throws', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox();

  await run(`
  const a = 1;
  const b = 2;
  return 1 +
  `)
    .catch(error => {
      t.equal(error.message, 'Unexpected token \'}\'');
    });
});

test('syntax error throws inside function', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox({ appendVersion: false });

  const result = await run(`
    return {
      add: (a, b) => {
        ohno();
      }
    }
  `);

  result.add().catch(error => {
    t.equal(error.message, 'ReferenceError: ohno is not defined\n    at add (<sandbox>:3:9)');
  });
});

test('runtime error throws', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox({ appendVersion: false });

  await run(`
  const a = 1;
  const b = 2;
  return b();
  `)
    .catch(error => {
      t.equal(error.message, 'TypeError: b is not a function\n    at sandbox (<sandbox>:3:10)');
    });
});

test('simple evaluation with function', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox();

  const result = await run(`
    function add (a, b) {
      return a + b
    }

    return add(1, 2);
  `);

  t.ok(result === 3, `${result} should equal 3`);
});

test('function on scope can get called', async (t) => {
  t.plan(2);

  const { run } = await createWorkerBox();
  const scope = {
    finish: () => {
      t.ok(true, 'finish should be called');
    }
  };

  const result = await run(`
    setTimeout(() => finish('withArg'), 1);
    return 'yes'
  `, scope);

  t.ok(result === 'yes', `${result} should equal 'yes'`);
});

test('function on scope can have callback as an argument', async (t) => {
  t.plan(3);

  const { run } = await createWorkerBox();
  const scope = {
    first: (arg1, returnHello) => {
      t.ok(true, 'first should be called');
      returnHello();
    },
    finish: () => {
      t.ok(true, 'finish should be called');
    }
  };

  const result = await run(`
    setTimeout(() => first('withArg', () => finish()), 1);
    return 'yes'
  `, scope);

  t.ok(result === 'yes', `${result} should equal 'yes'`);
});

test('returns a promise', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox();
  const scope = {
    test: () => 200
  };

  const result = await run(`
    return new Promise(resolve => {
      setTimeout(() => resolve('hi'), 1);
    });
  `, scope);

  t.ok(result === 'hi', `${result} should equal 'hi'`);
});

test('function on scope can return value', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox();
  const scope = {
    test: () => {
      return 200;
    }
  };

  const result = await run(`
    return test()
  `, scope);

  t.equal(result, 200);
});

test('callback as a function can return a value', async (t) => {
  t.plan(1);

  const { run } = await createWorkerBox();

  let storedCallback;
  const scope = {
    setCallback: function setCB (fn) {
      storedCallback = fn;
    }
  };

  await run(`
    setCallback(function myCB (){
      return 'worked';
    });
  `, scope);

  await new Promise(resolve => setTimeout(resolve, 300));

  t.equal(await storedCallback(), 'worked');
});

test('argsToString and stringToArgs', async (t) => {
  input = [{
    foo: 'bar',
    nested: {
      asdf: 'qwer'
    },
    array: [
      1,
      {
        three: 3
      },
      null
    ]
  }];

  const stringified = argsToString(input, f => f, f => {
    t.fail('runCallback should not be called');
  });
  const result = stringToArgs(stringified);
  t.deepEqual(result, input);
});

test('scopeToString and stringToScope', async (t) => {
  input = {
    foo: 'bar',
    nested: {
      asdf: 'qwer'
    },
    array: [
      1,
      {
        three: 3
      },
      null
    ]
  };

  const stringified = scopeToString(input, f => f, f => {
    t.fail('runCallback should not be called');
  });
  const result = stringToScope(stringified);
  t.deepEqual(result, input);
});

run().then(stats => {
  console.log('$$TEST_BROWSER_CLOSE$$:' + JSON.stringify(stats));
});
