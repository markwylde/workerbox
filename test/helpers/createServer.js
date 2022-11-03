import fs from 'fs';
import http2 from 'http2';
import servatron from 'servatron/http2.js';

async function createServer (code) {
  const server = http2.createSecureServer({
    key: fs.readFileSync('./node_modules/servatron/defaultCerts/key.pem'),
    cert: fs.readFileSync('./node_modules/servatron/defaultCerts/cert.pem')
  });
  server.on('error', (error) => console.error(error));

  const staticHandler = servatron({
    directory: './server/dist'
  });

  if (!code) {
    server.on('stream', staticHandler);
  }

  if (code) {
    server.on('stream', function (stream, headers) {
      if (headers[':path'] === '/') {
        stream.end(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon">
    <title>Document</title>
    <script src="./code.js" defer></script>
  </head>
  <body>
  </body>
  </html>
        `.trim());
        return;
      }

      if (headers[':path'] === '/code.js') {
        stream.end(code);
        return;
      }

      staticHandler(stream, headers);
    });
  }

  server.listen(null, '0.0.0.0');

  return new Promise(resolve => {
    server.on('listening', () => {
      const close = () => server.close();
      resolve({
        url: `https://0.0.0.0:${server.address().port}`,
        close,
        server
      });
    });
  });
}

export default createServer;
