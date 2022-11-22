import fs from 'fs';
import { minify } from 'minify';
import esbuild from 'esbuild';
import chokidar from 'chokidar';
import debounce from 'debounce';

const isWatching = process.argv[2] === '--watch';

const minifyOptions = {
  js: {
    ecma: '2020',
    mangle: {
      toplevel: true
    }
  }
};

async function build () {
  console.log(new Date(), 'rebuilding...');
  await fs.promises.rm('server/dist', { recursive: true, force: true });
  await fs.promises.mkdir('server/dist');

  await esbuild.build({
    entryPoints: ['./server/worker.js'],
    bundle: true,
    outfile: './server/dist/worker.js'
  }).then(console.log);

  if (!isWatching) {
    const minifiedHtml = await minify('server/dist/worker.js', minifyOptions);
    await fs.promises.writeFile('./server/dist/worker.js', minifiedHtml);
  }

  const jsData = await fs.promises.readFile('./server/dist/worker.js', 'utf8');
  const htmlData = await fs.promises.readFile('./server/index.html', 'utf8');
  await fs.promises.writeFile('./server/dist/index.html', htmlData.replace('{{WORKERSCRIPT}}', jsData));
  await fs.promises.rm('./server/dist/worker.js');
}

if (isWatching) {
  const debouncedBuild = debounce(build, 300);
  chokidar.watch(
    ['./utils/*', './lib/*', './server'], {
      ignored: ['**/dist']
    }).on('all', (why, what) => {
    console.log(new Date(), why, what);
    debouncedBuild();
  }
  );
} else {
  build();
}
