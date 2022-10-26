import fs from 'fs';
import { minify } from 'minify';
import esbuild from 'esbuild';
import chokidar from 'chokidar';
import debounce from './utils/debounce.js';

const minifyOptions = {
  js: {
    ecma: '2020',
    mangle: {
      eval: true,
      toplevel: true,
    },
  }
};

async function build () {
  console.log(new Date(), 'rebuilding...');
  await fs.promises.rm('server/dist', { recursive: true, force: true });
  await fs.promises.mkdir('server/dist');

  const minifiedHtml = await minify('server/index.html', minifyOptions)
  fs.promises.writeFile('./server/dist/index.html', minifiedHtml);

  await esbuild.build({
    entryPoints: ['./server/worker.js'],
    bundle: true,
    outfile: './server/dist/worker.js'
  }).then(console.log);

  const minifiedWorker = await minify('server/dist/worker.js', minifyOptions)
  fs.promises.writeFile('./server/dist/worker.js', minifiedWorker);
}


if (process.argv[2] === '--watch') {
  const debouncedBuild = debounce(build, 300);
  chokidar.watch(
    ['./utils/*', './lib/*', './server'], {
      ignored: ['**/dist']
    }).on('all', (why, what) => {
      console.log(new Date(), why, what);
      debouncedBuild()
    }
  );
} else {
  build();
}
