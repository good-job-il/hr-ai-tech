import net from 'node:net';
import http from 'node:http';

if (process.env.NODE_ENV !== 'test') throw new Error('Fake SMTP server requires NODE_ENV=test');

const smtpPort = Number(process.env.PHASE8_SMTP_PORT || 2525);
const httpPort = Number(process.env.PHASE8_MAIL_HTTP_PORT || 2526);
const messages = [];

const smtp = net.createServer(socket => {
  socket.setEncoding('utf8');
  socket.write('220 phase8.local ESMTP\r\n');
  let buffer = '';
  let dataMode = false;
  let message = '';

  socket.on('data', chunk => {
    buffer += chunk;
    while (buffer.includes('\n')) {
      const newline = buffer.indexOf('\n');
      const line = buffer.slice(0, newline + 1);
      buffer = buffer.slice(newline + 1);
      const command = line.replace(/\r?\n$/, '');

      if (dataMode) {
        if (command === '.') {
          messages.push(message);
          message = '';
          dataMode = false;
          socket.write('250 2.0.0 queued\r\n');
        } else {
          message += line;
        }
        continue;
      }

      if (/^(EHLO|HELO)\b/i.test(command)) socket.write('250-phase8.local\r\n250 SIZE 10485760\r\n');
      else if (/^DATA\b/i.test(command)) { dataMode = true; socket.write('354 End data with <CR><LF>.<CR><LF>\r\n'); }
      else if (/^QUIT\b/i.test(command)) { socket.write('221 2.0.0 bye\r\n'); socket.end(); }
      else socket.write('250 2.0.0 ok\r\n');
    }
  });
});

const api = http.createServer((request, response) => {
  if (request.url === '/messages') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ messages }));
    return;
  }
  response.writeHead(404).end();
});

await Promise.all([
  new Promise(resolve => smtp.listen(smtpPort, '127.0.0.1', resolve)),
  new Promise(resolve => api.listen(httpPort, '127.0.0.1', resolve)),
]);
console.log(`Phase 8 SMTP fixture listening on ${smtpPort}; messages API on ${httpPort}`);

const shutdown = () => {
  smtp.close();
  api.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
