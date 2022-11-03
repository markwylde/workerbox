import createTestSuite from 'just-tap';
import createWorkerBox from '../lib/index.js';

const { test, run } = createTestSuite({ concurrency: 1 });

test('simple evaluation', async (t) => {
  t.plan(1);

  const run = await createWorkerBox(serverUrl, { appendVersion: false });

  const result = await run('return 1 + 1');

  t.ok(result === 2, `${result} should equal 2`);
});

test('syntax error throws', async (t) => {
  t.plan(1);

  const run = await createWorkerBox(serverUrl, { appendVersion: false });

  await run('return 1 +')
    .catch(error => {
      t.ok(error.message === 'Unexpected token \'}\'', `'${error.message}' should equal 'Unexpected token '}'`);
    });
});

test('simple evaluation with function', async (t) => {
  t.plan(1);

  const run = await createWorkerBox(serverUrl, { appendVersion: false });

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

  const run = await createWorkerBox(serverUrl, { appendVersion: false });
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

  const run = await createWorkerBox(serverUrl, { appendVersion: false });
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

  const run = await createWorkerBox(serverUrl, { appendVersion: false });
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

// test('function on scope can return value', async (t) => {
//   t.plan(1);

//   const run = await createWorkerBox(serverUrl, { appendVersion: false });
//   const scope = {
//     test: () => 200
//   };

//   const result = await run(`
//     return test()
//   `, scope);

//   t.ok(result === '200', `${result} should equal 'yes'`);
// });

run().then(stats => {
  console.log('$$TEST_BROWSER_CLOSE$$:' + JSON.stringify(stats));
});
