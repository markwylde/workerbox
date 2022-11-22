import createWorkerBox from 'workerboxjs';
import debounce from '../utils/debounce';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';

const scopeEditor = new EditorView({
  doc: `
const scope = {
  name: 'Mark',

  getFullName: (first, last) => \`\${first} \${last}\`,

  clearToolbar: () => {
    toolbar.innerHTML = '';
  },

  addToolbarButton: (title, onClick) => {
    const element = document.createElement('button');
    element.textContent = title;
    element.addEventListener('click', () => {
      timesCalled = timesCalled + 1;
      onClick(timesCalled);
    });
    toolbar.appendChild(element);
  },

  addMessage: (message) => {
    const element = document.createElement('li');
    element.textContent = message;
    messages.appendChild(element);
  }
}
`.slice(1),
  extensions: [basicSetup, javascript(), EditorState.readOnly.of(true)],
  parent: document.querySelector('#scopePreview')
});

const editor = new EditorView({
  extensions: [basicSetup, javascript()],
  doc: `
// Let's clear our example toolbar between runs
clearToolbar();

// Scoped function calls can have arguments
addToolbarButton('Add Message', (timesCalled) => {
  console.log('Add message has been called', timesCalled, 'times');
  const time = (new Date()).toLocaleTimeString();
  addMessage(\`\${name}: \${time}\`);
});

// Note all functions are converted to promises
const fullName = await getFullName('Mark', 'Wylde');
console.log(fullName);

// You can define new functions
function add (a, b) {
  return a + b;
}

// And return the answer to be returned after execution
return add(1, 2);
  `.slice(1),
  parent: document.querySelector('#codeInput')
});

const codeOutput = document.querySelector('#codeOutput');

const runPromise = process.env.NODE_ENV === 'development'
  ? createWorkerBox('https://localhost:8002/', {
    appendVersion: false
  })
  : createWorkerBox('https://sandbox.workerbox.net/');

const toolbar = document.querySelector('#toolbar');
const messages = document.querySelector('#messages');

let timesCalled = 0;
async function execute () {
  const { run } = await runPromise;
  const code = editor.state.doc.toString();
  const scope = {
    name: 'Mark',

    getFullName: (first, last) => `${first} ${last}`,

    clearToolbar: () => {
      toolbar.innerHTML = '';
    },

    addToolbarButton: (title, onClick) => {
      const element = document.createElement('button');
      element.textContent = title;
      element.addEventListener('click', () => {
        timesCalled = timesCalled + 1;
        onClick(timesCalled);
      });
      toolbar.appendChild(element);
    },

    addMessage: (message) => {
      const element = document.createElement('li');
      element.textContent = message;
      messages.appendChild(element);
    }
  };

  try {
    const result = await run(code, scope);
    codeOutput.innerHTML = result;
  } catch (error) {
    codeOutput.innerHTML = error;
  }
}
execute();
const executeDebounce = debounce(execute, 500);
codeInput.addEventListener('input', executeDebounce);
codeInput.addEventListener('change', executeDebounce);
codeInput.addEventListener('keypress', executeDebounce);
codeInput.addEventListener('keyup', executeDebounce);
codeInput.addEventListener('paste', executeDebounce);
