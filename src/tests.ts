/* eslint-disable @typescript-eslint/no-explicit-any */
import { io as Client, Socket } from 'socket.io-client';
import { assert } from 'chai';
import { after, before, describe, it } from 'mocha';
import { app } from './index';
import { ClientToServerEvents, ServerSocketInstance, ServerToClientEvents, SocketActions, SocketServerActions, UserData, UserMessage } from './types';
import { App } from './app';

type ClientSocketInstance = Socket<ServerToClientEvents, ClientToServerEvents>;

const dummyUser1: UserData = {
  id: 1,
  name: 'dummy user',
  status: 'dummy user status',
  avatar: 'avatar.png',
};

const dummyUser2: UserData = {
  id: 2,
  name: 'dummy user 2',
  status: 'dummy user status 2',
  avatar: 'avatar2.png',
};

const dummyMessage1: UserMessage = {
  id: 1,
  text: 'New message from user 1',
  userId: dummyUser1.id,
  status: 'sent',
  date: new Date().toJSON(),
};

const dummyMessage2: UserMessage = {
  id: 2,
  text: 'New message from user 2',
  userId: dummyUser2.id,
  status: 'sent',
  date: new Date().toJSON(),
};

const url = `http://localhost:${App.SOCKET_PORT}/`;

function addUser(clientSocket, user, done?) {
  clientSocket.once(SocketActions.USERS, users => {
    const newUser: any = users.find(u => u.id === user.id);
    assert.isDefined(newUser, `user ${user.name} should be added`);
    assert.equal(newUser.name, user.name);
    assert.equal(newUser.status, user.status);
    assert.equal(newUser.avatar, user.avatar);
    assert.equal(newUser.online, true);
    assert.isDefined(newUser.connectedDate);
    assert.isBelow(new Date(newUser.connectedDate || '99999').getTime(), new Date().getTime());
    assert.isDefined(newUser.socketId);
    done?.();
  });
  clientSocket.emit(SocketActions.USER_ADD, user);
}

function checkUser(receivedUser, dummyUser) {
  assert.isDefined(receivedUser, `user ${dummyUser.name} should be defined`);
  assert.equal(receivedUser.name, dummyUser.name);
  assert.equal(receivedUser.status, dummyUser.status);
  assert.equal(receivedUser.avatar, dummyUser.avatar);
  assert.isDefined(receivedUser.online);
  assert.isDefined(receivedUser.connectedDate);
  assert.isBelow(new Date(receivedUser.connectedDate || '99999').getTime(), new Date().getTime());
  assert.isDefined(receivedUser.socketId);
}

describe('Test Zen chat sockets', () => {
  let io = app.io;
  let serverSocket: ServerSocketInstance;
  let clientSockets: ClientSocketInstance[] = [];

  before((done) => {
    io.on('connection', () => {
      serverSocket = app.socket;
    });
    clientSockets[0] = Client(url, {
      secure: true,
    });
    clientSockets[0].on('connect', done);
  });

  after(() => {
    io.close();
    clientSockets.forEach(client => client.close());
  });

  it('should return empty user list', (done) => {
    clientSockets[0].once(SocketActions.USERS, users => {
      assert.equal(users.length, 0);
      done();
    });
    clientSockets[0].emit(SocketActions.USERS_GET);
  });

  it('should add new user', (done) => {
    addUser(clientSockets[0], dummyUser1, done);
  });

  it('should return user list with 1 item', (done) => {
    clientSockets[0].once(SocketActions.USERS, users => {
      assert.equal(users.length, 1);
      done();
    });
    clientSockets[0].emit(SocketActions.USERS_GET);
  });

  it('should add another user', (done) => {
    clientSockets[1] = Client(url, {
      secure: true,
    });
    addUser(clientSockets[1], dummyUser2, done);
  });

  it('should not create user dupes', (done) => {
    clientSockets[0].once(SocketActions.USERS, users => {
      const ids = users.map(u => u.id).filter(id => id === dummyUser1.id);
      assert.equal(ids.length, 1);
      done();
    });
    clientSockets[0].emit(SocketActions.USER_ADD, dummyUser1);
  });

  it('user 1 should send message', (done) => {
    clientSockets[0].once(SocketActions.MESSAGES, messages => {
      const msg: any = messages.find(m => m.userId === dummyUser1.id);
      assert.equal(msg.text, dummyMessage1.text);
      assert.equal(msg.status, 'received');
      assert.isAbove(new Date(msg.date).getTime(), new Date(dummyMessage1.date).getTime());
      done();
    });
    clientSockets[0].emit(SocketActions.MESSAGE_ADD, dummyMessage1);
  });

  it('should remove user 1', (done) => {
    clientSockets[0].once(SocketActions.USERS, users => {
      const newUser: any = users.find(u => u.id === dummyUser1.id);
      assert.isUndefined(newUser);
      done();
    });
    clientSockets[0].emit(SocketActions.USER_LEAVE, dummyUser1.id);
  });

  it('should not return messages of removed user', (done) => {
    clientSockets[0].once(SocketActions.MESSAGES, messages => {
      const msg: any = messages.find(m => m.userId === dummyUser1.id);
      assert.isUndefined(msg);
      done();
    });
    clientSockets[0].emit(SocketActions.MESSAGE_GET);
  });

  it('should disconnect user 2 and set online = false', (done) => {
    serverSocket.once(SocketServerActions.DISCONNECT, () => {
      const user: any = app.users.find(u => u.id === dummyUser2.id);
      checkUser(user, dummyUser2);
      assert.equal(user.online, false);
      done();
    });
    clientSockets[1].disconnect();
  });

  it('should restore connection for user 2 and set online = true', (done) => {
    clientSockets[1].on('connect', () => {
      clientSockets[1].once(SocketActions.USERS, users => {
        const user: any = users.find(u => u.id === dummyUser2.id);
        checkUser(user, dummyUser2);
        assert.equal(user.online, true);
        done();
      });

      clientSockets[1].emit(SocketActions.USER_ADD, dummyUser2);
    });
    clientSockets[1].connect();
  });

  it('user 2 should send message', (done) => {
    clientSockets[1].once(SocketActions.MESSAGES, messages => {
      const msg: any = messages.find(m => m.userId === dummyUser2.id);
      assert.equal(msg.text, dummyMessage2.text);
      assert.equal(msg.status, 'received');
      assert.isAbove(new Date(msg.date).getTime(), new Date(dummyMessage2.date).getTime());
      done();
    });
    clientSockets[1].emit(SocketActions.MESSAGE_ADD, dummyMessage2);
  });

  it('should not create message dupes', (done) => {
    clientSockets[1].once(SocketActions.MESSAGES, messages => {
      const ids = messages.map(u => u.id).filter(id => id === dummyMessage2.id);
      assert.equal(ids.length, 1);
      done();
    });
    clientSockets[1].emit(SocketActions.MESSAGE_ADD, dummyMessage2);
  });

  it('should return messages', (done) => {
    clientSockets[1].once(SocketActions.MESSAGES, messages => {
      const msg: any = messages.find(m => m.userId === dummyUser2.id);
      assert.equal(msg.text, dummyMessage2.text);
      assert.equal(msg.status, 'received');
      assert.isAbove(new Date(msg.date).getTime(), new Date(dummyMessage2.date).getTime());
      done();
    });
    clientSockets[1].emit(SocketActions.MESSAGE_GET);
  });

  it('should remove message', (done) => {
    clientSockets[1].once(SocketActions.MESSAGES, messages => {
      const msg: any = messages.find(m => m.userId === dummyUser2.id);
      assert.isUndefined(msg);
      done();
    });
    clientSockets[1].emit(SocketActions.MESSAGE_REMOVE, dummyMessage2.id);
  });
});
