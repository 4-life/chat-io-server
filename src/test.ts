/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import { Server } from 'socket.io';
import { assert } from 'chai';
import { after, before, describe, it } from 'mocha';

describe('my awesome project', () => {
  let io;
  let serverSocket;
  let clientSocket;

  before((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = (httpServer.address() as any)['port'];
      const url = `http://localhost:${port}`;
      clientSocket = new (Client as any)(url);
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  after(() => {
    io.close();
    clientSocket.close();
  });

  it('should work', (done) => {
    clientSocket.on('hello', (arg) => {
      assert.equal(arg, 'world');
      done();
    });
    serverSocket.emit('hello', 'world');
  });

  it('should work (with ack)', (done) => {
    serverSocket.on('hi', (cb) => {
      cb('hola');
    });
    clientSocket.emit('hi', (arg) => {
      assert.equal(arg, 'hola');
      done();
    });
  });
});
