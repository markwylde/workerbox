import createWorkerBox from 'workerboxjs';
import debounce from '../utils/debounce';

const codeInput = document.querySelector('#codeInput');
const codeOutput = document.querySelector('#codeOutput');

// const runPromise = createWorkerBox('https://workerbox.net/');
const runPromise = createWorkerBox('https://localhost:8002/', {
  appendVersion: false,
  randomiseSubdomain: false
});

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
