import { SocketService } from './services/socket';
import logs from './services/logs';

export class App {
  public static readonly SOCKET_PORT: number = 3005;
  private socketPort: number;
  protected socketService: SocketService;

  constructor() {
    this.socketPort = App.SOCKET_PORT;
    this.socketService = new SocketService(this.socketPort);
  }

  getApp() {
    logs.addBreadcrumbs(`Running socket on port ${this.socketPort} 🚀`, 'server');
  }
}
