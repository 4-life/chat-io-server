import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

import logs from './logs';
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketActions, SocketServerActions, UserData, UserMessage } from '../types';
import env from '../environment';

const { CLIENT_URL } = env();

export class SocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, UserData>;
  private port: number;
  private users: UserData[] = [];
  private messagesList: UserMessage[] = [];

  constructor(port: number) {
    this.port = port;
    const httpServer = createServer();
    this.io = new Server(httpServer, {
      cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
      }
    });
    this.io.on(SocketServerActions.CONNECTION, (socket) => this.connectSocket(socket));

    httpServer.listen(port);
  }

  public connectSocket(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, UserData>) {
    logs.addBreadcrumbs(`Connected client on port ${this.port}, ${socket.id}`, 'socket');

    socket.on(SocketActions.USER_ADD, (user) => this.userAdd(user, socket.id));
    socket.on(SocketActions.USER_LEAVE, (id) => this.userLeave(id));
    socket.on(SocketActions.MESSAGE_GET, () => this.getMessages());
    socket.on(SocketActions.MESSAGE_ADD, (msg) => this.messageAdd(msg));

    socket.on(SocketServerActions.DISCONNECT, () => this.disconnect(socket.id));
    socket.on(SocketServerActions.ERROR, (e) => this.error(e));
  }

  private error(err) {
    logs.error(err.message, 'socket');
  }

  private userAdd(user: UserData, socketId: string) {
    const userIndex = this.users.findIndex((u) => u.id === user.id);

    if (userIndex < 0) {
      this.users.push({
        ...user,
        socketId,
        connectedDate: new Date().toJSON(),
        online: true,
      });
    } else {
      this.users[userIndex].online = true;
      this.users[userIndex].socketId = socketId;
    }

    this.io.emit(SocketActions.USERS, this.users);
  }

  private messageAdd(msg: UserMessage) {
    const exist = this.messagesList.find((m) => m.id === msg.id);

    if (!exist) {
      this.messagesList.push({
        ...msg,
        status: 'received',
      });
    }

    this.io.emit(SocketActions.MESSAGES, this.messagesList);
  }

  private userLeave(id: number) {
    const index = this.users.findIndex((user) => user.id === id);

    if (index >= 0) {
      this.users.splice(index, 1);
      this.io.emit(SocketActions.USERS, this.users);
    }
  }

  private getMessages() {
    this.io.emit(SocketActions.MESSAGES, this.messagesList);
  }

  private disconnect(socketId: string) {
    const userIndex = this.users.findIndex((u) => u.socketId === socketId);

    if (userIndex >= 0) {
      this.users[userIndex].online = false;
    }

    this.io.emit(SocketActions.USERS, this.users);
  }

}
