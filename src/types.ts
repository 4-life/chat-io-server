import { Socket } from 'socket.io';

export interface UserData {
  id: number;
  name: string;
  status: string;
  connectedDate?: string;
  messages?: number;
  online?: boolean;
  avatar: string;
  socketId?: string;
}

export interface UserMessage {
  id: number;
  me?: boolean;
  status: 'sent' | 'received';
  date: string;
  text: string;
  userId: number;
}

export enum SocketActions {
  USER_ADD = 'user:add',
  USER_LEAVE = 'user:leave',
  MESSAGE_GET = 'message:get',
  MESSAGE_ADD = 'message:add',
  MESSAGE_REMOVE = 'message:remove',
  USERS = 'users',
  MESSAGES = 'messages',
}

export interface ServerToClientEvents {
  [SocketActions.USERS]: (users: UserData[]) => void;
  [SocketActions.MESSAGES]: (messages: UserMessage[]) => void;
}

export interface ClientToServerEvents {
  [SocketActions.USER_ADD]: (user: UserData) => void;
  [SocketActions.MESSAGE_GET]: () => void;
  [SocketActions.MESSAGE_ADD]: (message: UserMessage) => void;
  [SocketActions.MESSAGE_REMOVE]: (id: number) => void;
  [SocketActions.USER_LEAVE]: (id: number) => void;
}

export type ServerSocketInstance = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, UserData>;

export interface InterServerEvents {
  ping: () => void;
}

export enum SocketServerActions {
  DISCONNECT = 'disconnect',
  CONNECTION = 'connection',
  ERROR = 'error',
}
