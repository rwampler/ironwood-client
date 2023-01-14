import { DateTime } from 'luxon';
import EventEmitter from 'events';

import Account from '~/plugins/ironwood/account/account';
import Actor from './actor/actor';
import ServerMetadata from '~/plugins/ironwood/server/server-metadata';
import StorageUtils from '~/plugins/ironwood/util/storage-utils';


const VIEW_WIDTH = 1000 * 10;
const VIEW_HEIGHT = 1000 * 10;

const AUTH_JWT = 'auth.jwt';
const AUTH_TOKEN = 'auth.token';

export enum Status {
  PENDING_METADATA = 'PENDING_METADATA',
  PENDING_ACCOUNT = 'PENDING_ACCOUNT',
  PENDING_ASSETS = 'PENDING_ASSETS',
  PENDING_INITIALIZE = 'PENDING_INITIALIZE',
  RUNNING = 'RUNNING'
}

class SimulationMetadata  {
  loaded: boolean = false;

  simulationTime: DateTime = DateTime.now();
  simulationTimeVelocity: number = 0;

  serverTime: number = performance.now();
  clientTime: number = performance.now();
};

class ActorMetadata  {
  actorById: Record<string, Actor> = {};
  activeActorIds: Set<string> = new Set();
};

class Metadata  {
  server?: ServerMetadata;
  simulation: SimulationMetadata = new SimulationMetadata();

  actor: ActorMetadata = new ActorMetadata();
};

class Authorization {
  accessToken?: string | null;
  refreshToken?: string | null;

  get isAuthorized (): boolean { return !!this.accessToken?.length; }
}

class Assets {
  loaded: boolean = false;
}

class Render {
  initailized: boolean = false;

  height: number = 0;
  width: number = 0;

  chunkColumns: number = 0;
  chunkRows: number = 0;

  visibleChunks: Set<string> = new Set();
}

class View {
  dirty: boolean = false;
  x: number = 0;
  y: number = 0;
  scale: number = 1;
}

class Input {
  primaryDown: boolean = false;

  startX: number = 0;
  lastX: number = 0;

  startY: number = 0;
  lastY: number = 0;
}

export default class State {
  metadata: Metadata;

  auth: Authorization;
  account?: Account | null;

  connecting: boolean = false;
  connected: boolean = false;

  assets: Assets;

  render: Render;
  view: View;
  input: Input;

  events: EventEmitter;
  status: Status;

  constructor () {
    this.metadata = new Metadata();

    this.auth = new Authorization();
    this.account = null;

    this.assets = new Assets();

    this.render = new Render();
    this.view = new View();
    this.input = new Input();

    this.events = new EventEmitter();
    this.status = Status.PENDING_METADATA;
    // this.chunks = {};

    this.loadAuthorization();
  }

  determineStatus (): Status {
    if (!this.metadata.server) return Status.PENDING_METADATA;
    if (!this.account) return Status.PENDING_ACCOUNT;
    if (!this.assets.loaded) return Status.PENDING_ASSETS;
    if (!this.render.initailized || !this.metadata.simulation.loaded) return Status.PENDING_INITIALIZE;
    return Status.RUNNING;
  }

  updateStatus (): void {
    const newStatus: Status = this.determineStatus();
    if (newStatus != this.status) {
      this.status = newStatus;
      this.events.emit('status', this.status);
    }
  }

  setServerMetadata (metadata: ServerMetadata): void {
    this.metadata.server = metadata;
    this.updateStatus();
  }

  setAuthorization (accessToken: string | null, refreshToken: string | null): void {
    this.auth.accessToken = accessToken;
    this.auth.refreshToken = refreshToken;

    StorageUtils.setLocalStorage(AUTH_JWT, this.auth.accessToken);
    StorageUtils.setLocalStorage(AUTH_TOKEN, this.auth.refreshToken);
  }
  loadAuthorization (): void {
    this.auth.accessToken = localStorage.getItem(AUTH_JWT);
    this.auth.refreshToken = localStorage.getItem(AUTH_TOKEN);
  }
  clearAuthorization (): void {
    this.setAuthorization(null, null);
  }

  setAccount (account: Account | null): void {
    this.account = account;
    this.updateStatus();
  }

  setAssets (): void {
    this.assets.loaded = true;
    this.updateStatus();
  }

  setRenderInitialized (): void {
    this.render.initailized = true;
    this.updateStatus();
  }

  panViewTarget (deltaX: number, deltaY: number): void {
    this.setViewTarget(this.view.x + 1.0 * (deltaX / this.view.scale), this.view.y + 1.0 * (deltaY / this.view.scale));
  }
  setViewTarget (x: number, y: number): void {
    // this.view.x = x < 0 ? VIEW_WIDTH + x : x > VIEW_WIDTH ? x - VIEW_WIDTH : x;
    // this.view.y = y < 0 ? VIEW_HEIGHT + y : y > VIEW_HEIGHT ? y - VIEW_HEIGHT : y;
    this.view.x = x < 0 ? 0 : x > VIEW_WIDTH ? VIEW_WIDTH : x;
    this.view.y = y < 0 ? 0 : y > VIEW_HEIGHT ? VIEW_HEIGHT : y;
    this.view.dirty = true;
  }

  decreaseScale (): void {
    this.view.scale -= .5;
    if (this.view.scale < 1) this.view.scale = 1;
    this.view.dirty = true;
  }
  increaseScale (): void {
    this.view.scale += .5;
    if (this.view.scale > 8) this.view.scale = 8;
    this.view.dirty = true;
  }

  simulationTimeSeconds (clientTimeMs: number): number {
    const initialTimeSeconds = this.metadata?.simulation.simulationTime.toSeconds() ?? 0;
    const elapsedSeconds = (clientTimeMs - this.metadata?.simulation.serverTime) * this.metadata?.simulation.simulationTimeVelocity;
    return initialTimeSeconds + elapsedSeconds;
  }

  initializeSimulation (data: any): void {
    this.setViewTarget(data.view.x, data.view.y);

    this.metadata.simulation.simulationTime = DateTime.fromISO(data.time.simulationTime);
    this.metadata.simulation.simulationTimeVelocity = parseFloat(data.time.simulationTimeVelocity);
    this.metadata.simulation.serverTime = parseFloat(data.time.serverTime);
    this.metadata.simulation.loaded = true;

    for (let actor of (data.actors ?? []).map(Actor.fromJson)) {
      this.metadata.actor.actorById[actor.id] = actor;
      this.events.emit('actor.add', actor);
    }

    this.updateStatus();
  }

  updateSimulation (data: any): void {
    this.metadata.simulation.simulationTime = DateTime.fromISO(data.time.simulationTime);
    this.metadata.simulation.simulationTimeVelocity = parseFloat(data.time.simulationTimeVelocity);
    this.metadata.simulation.serverTime = parseFloat(data.time.serverTime);

    const actors = (data.updatedActors ?? []).map(Actor.fromJson);

    if (actors.length) {
      for (let actor of actors) {
        if (this.metadata.actor.actorById[actor.id]) {
          this.metadata.actor.actorById[actor.id] = actor;
          this.events.emit('actor.update', actor);
        }
        else {
          this.metadata.actor.actorById[actor.id] = actor;
          this.events.emit('actor.add', actor);
        }

        if (actor.actions.length) {
          this.metadata.actor.activeActorIds.add(actor.id);
        }
      }
      this.view.dirty = true;
    }
  }

}
