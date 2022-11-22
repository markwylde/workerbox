# WorkerBox
A secure sandbox to execute untrusted user JavaScript, in a web browser, without any risk to your own domain/site/page.

## Installation
To ensure the untrusted code can not access any data, permissions,  that have been given to your site, it's important the evaluator is run on a domain completely separate from your own site.

The separate domain code is located in the [`./server`](./server) folder of this repo. You can host it yourself, but make sure it's on another domain, or feel free to use the default one for free at [https://workerbox.net/](https://workerbox.net/).

### Install npmjs
```
npm install --save workerboxjs
```

## Usage
```javascript
import createWorkerBox from 'workerboxjs';

const { run, destroy } = await createWorkerBox('https://sandbox.workerbox.net/');

const scope = {
  name: 'Mark',
  getMessage: () => 'Have a great day!'
};

const result = await run(`
  async function sayHello (who) {
    return 'Hello ' + who + '. ' + await getMessage();
  }

  return sayHello(name);
`, scope);

// result === 'Hello Mark. Have a great day!'

destroy() // Destroys the worker box, terminating any running workers
```

## How does it work?
An iframe is inserted into the page from a completely separate domain.

The iframe then creates a web worker, and handles posting messages between the iframe, webworker and your own app.

Because the only communication between the user code and the workerbox instead is done through messaging, the argument inputs and outputs must all be JSON serializable.
