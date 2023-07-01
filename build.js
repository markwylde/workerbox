import fs from 'fs';
import { minify } from 'minify';
import esbuild from 'esbuild';
import chokidar from 'chokidar';
import debounce from 'debounce';

const isWatching = process.argv[2] === '--watch';

const minifyOptions = {
  js: {
    ecma: '2020',
    keep_fnames: true,
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
  let htmlData = await fs.promises.readFile('./server/index.html', 'utf8');
  htmlData = htmlData.replace('{{WORKERSCRIPT}}', jsData);
  await fs.promises.writeFile('./server/dist/index.html', htmlData);
  await fs.promises.writeFile(
    './lib/builtinWorker.html.js',
    '// built from the ./server/dist/index.html file during npm run build\nconst builtinWorker = atob(`' + Buffer.from(htmlData).toString('base64') + '`); export default builtinWorker;'
  );
  await fs.promises.rm('./server/dist/worker.js');
}

if (isWatching) {
  const debouncedBuild = debounce(build, 300);
  chokidar.watch(
    ['./lib/*', './server'], {
      ignored: ['**/dist/**', './lib/builtinWorker.html.js']
    }).on('all', (why, what) => {
    console.log(new Date(), why, what);
    debouncedBuild();
  }
  );
} else {
  build();
}
