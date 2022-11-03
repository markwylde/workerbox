import path from 'path';
import bundle from './helpers/bundle.js';
import run from './helpers/run.js';
import createServer from './helpers/createServer.js';

const server = await createServer();

const testSuiteBundle = await bundle(path.resolve('./test/suite.js'), {
  serverUrl: `"${server.url}"`
});

const results = await run(testSuiteBundle)
  .catch(console.log);
server.close();

if (!results?.success) {
  throw new Error('not all tests passed');
}

