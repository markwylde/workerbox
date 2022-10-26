import createWorkerBox from 'workerboxjs';
import debounce from '../utils/debounce';

const codeInput = document.querySelector('#codeInput');
const codeOutput = document.querySelector('#codeOutput');

const runPromise = process.env.NODE_ENV === 'development'
  ? createWorkerBox('https://localhost:8002/', {
    appendVersion: false
  })
  : createWorkerBox('https://sandbox.workerbox.net/');

async function execute () {
  const run = await runPromise;
  const code = codeInput.value;
  try {
    const result = await run(code);
    codeOutput.innerHTML = result;
  } catch (error) {
    codeOutput.innerHTML = error;
  }
}
execute();
codeInput.addEventListener('input', debounce(execute, 150));
