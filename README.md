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

const run = await createWorkerBox('https://sandbox.workerbox.net/');

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
```

## How does it work?
An iframe is inserted into the page from a completely separate domain.

The iframe then creates a web worker, and handles posting messages between the iframe, webworker and your own app.

Because the only communication between the user code and the workerbox instead is done through messaging, the argument inputs and outputs must all be JSON serializable.

## Caveats
### Storage
Web workers can't use cookies or localStorage, but even if they could they would be isolated to third party domain that is running the code.

However, there are some ways to store data. For example, indexDB.

While your unsafe user code can not access the indexDB of your own site, it can use the instance on the server's site.

But remember, anyone can run untrusted user code on the workerbox site. So if your users store data on the workerbox domain, technically anyone can view that data.

Therefore, you should advise your users not to store any data using the web workers API.

Of course, you could provide an abstraction on the `scope` that would safely allow you to store data on your own domain.
