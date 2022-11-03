import fs from 'fs';
import esbuild from 'esbuild';

async function bundle (file, define) {
  const randomFileName = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const { errors, warnings } = await esbuild.build({
    entryPoints: [file],
    sourcemap: 'both',
    outfile: `/tmp/${randomFileName}.min.js`,
    bundle: true,
    define
  });
  if (errors.length > 0 || warnings.length > 0) {
    console.log({ errors, warnings });
    throw new Error('code build has errors');
  }

  const bundledCode = await fs.promises.readFile(`/tmp/${randomFileName}.min.js`, 'utf8');

  await fs.promises.rm(`/tmp/${randomFileName}.min.js`);

  return bundledCode;
}

export default bundle;
