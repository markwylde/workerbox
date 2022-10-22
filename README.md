# WorkerBox
A secure sandbox to execute untrusted user JavaScript, in a web browser, without any risk to your own domain/site/page.

## Installation
To ensure the untrusted code can not access any cookies, localStorage or other permissions that have been given to your site, it's important the evaluator is run on a domain completely separate from your own site.

The separate domain code is located in the [`./server`](./server) folder of this repo. You can host it yourself, but make sure it's on another domain, or feel free to use the default one for free at [https://workerbox.net/](https://workerbox.net/).

### Install npmjs
```
npm install --save workerboxjs
```

## Usage
```javascript
import createWorkerBox from 'workerboxjs';

const run = await createWorkerBox('https://sandbox.workerbox.net/');

const result = await run(`
  function add (a, b) {
      return a + b;
  }
  add(1, 2);
`);

// result === 3
```
