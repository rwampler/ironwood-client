import _ from 'lodash';
import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';

import State from '~/plugins/ironwood/state';
import { ReinhardToneMapping } from 'three';

export interface AccountInfo {
  id: string;
  username: string;
  name: string;
};

export interface MetadataResponse {
  seed: string;
  chunkSize: number;
  chunkColumnCount: number;
  chunkRowCount: number;
  account: AccountInfo;
}

export interface AccountResponse extends AccountInfo {
  accessToken: string;
  refreshToken: string;
};

export default class ApiClient {
  state: State;
  client: AxiosInstance;
  socket: Socket;

  updateViewTargetDebounced?: Function;

  constructor (state: State) {
    axios.defaults.withCredentials = true;
    this.state = state;
    this.client = axios.create({
      baseURL: 'http://localhost:19160'
    });

    this.socket = io('ws://localhost:19160', {
      autoConnect: false
    });

    this.configure();
  }

  auth (options: object): object {
    const headers: any = { };
    if (this.state.auth.accessToken) {
      headers.Authorization = `JWT ${this.state.auth.accessToken}`;
    }
    return Object.assign(options, { headers: headers });
  }

  handle (requestPromise: Promise<any>, resultTransformer?: Function): Promise<any> {
    return new Promise((done, error) => {
      requestPromise
          .then((result: any) => done(resultTransformer ? resultTransformer(result.data) : result.data))
          .catch((err) => {
            // if (!err.status) this.state.handle_connection_error();
            // if (err.response?.status == 401 || err.response?.status == 403) this.state.handle_authorization_error();
            error(err.response ?? err);
          });
    });
  }

  delete (path: string, config: object, resultTransformer?: Function) {
    return this.handle(this.client.delete(path, this.auth(config)), resultTransformer);
  }
  get (path: string, query?: any, resultTransformer?: Function) {
    return this.handle(this.client.get(path, this.auth({ params: (query ?? {}) })), resultTransformer);
  }
  getBinary (path: string, query?: any, resultTransformer?: Function) {
    return this.handle(this.client.get(path, this.auth({ responseType: 'arraybuffer', params: (query ?? {}) })), resultTransformer);
  }
  post (path: string, parameters?: any, resultTransformer?: Function) {
    return this.handle(this.client.post(path, parameters ?? {}, this.auth({})), resultTransformer);
  }
  put (path: string, parameters?: any, resultTransformer?: Function) {
    return this.handle(this.client.put(path, parameters ?? {}, this.auth({})), resultTransformer);
  }
  patch (path: string, parameters?: any, resultTransformer?: Function) {
    return this.handle(this.client.patch(path, parameters ?? {}, this.auth({})), resultTransformer);
  }

  getMetadata (): Promise<MetadataResponse> {
    return this.get("/metadata");
  }

  createAccount (username: string, password: string): Promise<AccountResponse> {
    return this.handle(this.client.post("/account/create", {
      username: username,
      password: password,
      rememberMe: true
    }));
  }

  loginAccount (username: string, password: string): Promise<AccountResponse> {
    return this.handle(this.client.post("/account/login", {
      username: username,
      password: password,
      rememberMe: true
    }));
  }

  logoutAccount (): Promise<void> {
    return this.post("/account/logout");
  }

  connect (): void {
    if (this.state.connecting || this.state.connected) {
      console.warn("Connecting or already connected");
    }
    else {
      this.socket.io.opts.extraHeaders = {
        Authorization: `JWT ${this.state.auth.accessToken}`
      };
      this.state.connecting = true;
      this.socket.connect();
    }
  }

  configure () {
    this.socket.on('connect_error', (error) => {
      console.log(`error: ${error}`);
    });

    this.socket.on('connect', () => {
      this.state.connecting = false;
      this.state.connected = true;
      this.state.updateStatus();
    });

    this.socket.on('disconnect', () => {
      this.state.connecting = false;
      this.state.connected = false;
      this.state.updateStatus();
    });

    this.socket.on('initialize', (data: any) => {
      this.state.initializeSimulation(data);
    });

    this.socket.on('simulation', (data) => {
      this.state.updateSimulation(data);
    });
  }

  updateViewTarget = _.debounce((viewX: number, viewY: number) => {
    this.socket.emit('view', { viewX: viewX, viewY: viewY });
  }, 1000);

}