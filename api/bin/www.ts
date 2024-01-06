#!/usr/bin/env -vS npm exec tsx

/**
 * Module dependencies.
 */
import { app } from '../app';
import debug from 'debug';
import http from 'http';

debug('spill-it:server');

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(
  /** @type {string} */ val
) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 * 
 * About `error`:
 * - The closest type seems to be [`SystemError`](https://nodejs.org/api/errors.html#class-systemerror)
 * - However type definitions for this does not exist
 *   - https://github.com/DefinitelyTyped/DefinitelyTyped/issues/33217
 *   - https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/64508
 *   - https://stackoverflow.com/questions/60043274/how-can-i-instantiate-a-new-systemerror-object-in-node-js
 *   - https://gist.github.com/reporter123/7c10e565fb849635787321766b7f8ad8
 * - Intuitively `SystemError` seems like it should be available globally or as part of a 'node:errors' module but neither of these is true
 * - `ErrnoException` defines similar properties used below...
 *   - https://stackoverflow.com/questions/40141005/property-code-does-not-exist-on-type-error
 */
function onError(
  /** @type {NodeJS.ErrnoException} */ error
) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  /** Handle specific listen errors with friendly messages */
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr?.port;
  debug('Listening on ' + bind);
}
