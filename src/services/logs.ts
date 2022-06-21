/* eslint-disable no-console */
// eslint-disable-next-line no-undef
const debug = require('debug');

const DEBUG = !!process.env.DEBUG;

const LOG = {
  db: debug('db'),
  http: debug('http'),
  server: debug('server'),
  socket: debug('socket'),
};

debug.log = console.info.bind(console);

function info(text: string): void {
  if (DEBUG) {
    console.info('Info:', text);
  }
}

function error(message: string, category: keyof typeof LOG): void {
  LOG[category](message);
}

function warning(message: string, category: keyof typeof LOG): void {
  LOG[category](message);
}

function addBreadcrumbs(message: string, category: keyof typeof LOG): void {
  LOG[category](message);
}

const logs = {
  info,
  error,
  warning,
  addBreadcrumbs,
};

export default logs;
