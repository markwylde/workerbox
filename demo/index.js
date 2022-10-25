import createWorkerBox from 'workerboxjs';
import debounce from './utils/debounce';

const codeInput = document.querySelector('#codeInput');
const codeOutput = document.querySelector('#codeOutput');

async function execute () {
  const run = await createWorkerBox('https://workerbox.net/');
  const code = codeInput.value;
  const result = await run(code);
  codeOutput.innerHTML = result;
}
execute();
codeInput.addEventListener('input', debounce(execute, 150));
