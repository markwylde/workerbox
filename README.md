# WorkerBox
A secure sandbox to execute untrusted user JavaScript, in a web browser, without any risk to your own domain/site/page.

## Installation
```
npm install --save workerboxjs
```

## Usage
```javascript
import createWorkerBox from 'workerboxjs';

// Note each `workerbox` instance has it's own sandbox
const { run, destroy } = await createWorkerBox();

let callback;
const scope = {
  name: 'Mark',
  getMessage: () => 'Have a great day!',
  setCallback: fn => {
    // You can store arguments, objects, arrays and returned values
    // outside of the scope of your main app, and then call them
    // from anywhere, so long as the worker is not destroyed.
    callback = fn;
  }
};

setInterval(() => {
  if (callback) {
    // This will communicate with the workerbox transparently.
    callback();
  }
});

// You can save state between running code
// But this will not save between different workerbox instances.
await run(`
  globalThis.sharedVariable = 123
`);

const result = await run(`
  // globalThis.sharedVariable === 123;

  async function sayHello (who) {
    return 'Hello ' + who + '. ' + await getMessage();
  }

  return sayHello(name);
`, scope);

// result === 'Hello Mark. Have a great day!'

// Destroys the workerbox, terminating the webworker
destroy()
```

## Development
If you want to check this project out locally, you can do the following:

### Run your own local server
```
git clone https://github.com/markwylde/workerbox.git
cd workerbox
npm install
npm run start
```

Visit https://0.0.0.0:8002 in your browser and make sure to ignore the TLS security errors.
Web workers will only work in secure contexts, so we need to do this locally.

### Run the demo project
```
cd demo
npm install
npm run start
```

Visit https://0.0.0.0:8000 in your browser.

### Run the tests

Build the server side component and run the tests:

```
npm run build
npm test
```

## How does it work?
An iframe is inserted into the page (optionally from a completely separate domain).

The iframe then creates a web worker, and handles posting messages between the iframe, webworker and your own app.

Because the only communication between the user code and the workerbox is done through messaging, the argument inputs and outputs must all be JSON serializable.


### Separate domain
While the iframe has the `sandbox="allow-scripts"` attribute set, and therefore acts like it's on another domain, you can still run the server on another domain if you wish.

```javascript
const { run } = await createWorkerBox({
  serverUrl: 'https://sandbox.workerbox.net',
  appendVersion: true
});
```