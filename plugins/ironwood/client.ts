
import ApiClient from '~/plugins/ironwood/api-client';
import Input from '~/plugins/ironwood/input';
import State from '~/plugins/ironwood/state';

import AccountManager from '~/plugins/ironwood/account/account-manager';
import ServerManager from '~/plugins/ironwood/server/server-manager';

import Environment from '~~/plugins/ironwood/renderer/environment';
import Renderer from '~/plugins/ironwood/renderer/renderer';


export default class Client {
  state: State;

  api: ApiClient;
  accountManager: AccountManager;
  serverManager: ServerManager;

  renderDomId: string;
  renderer: Renderer;
  input: Input;
  environment: Environment;

  constructor (renderDomId: string, state: State) {
    this.state = state;

    this.renderDomId = renderDomId;
    this.renderer = new Renderer(renderDomId, state);
    this.environment = new Environment(this.renderer.application, state);
    this.input = new Input(state);

    this.api = new ApiClient(state);
    this.accountManager = new AccountManager(this.api, state);
    this.serverManager = new ServerManager(this.api, state);
  }

  handleResize (): void {
    const container: HTMLElement | null = document.getElementById(this.renderDomId);
    if (container) {
      this.state.render.width = Math.ceil(container.offsetWidth);
      this.state.render.height = Math.ceil(container.offsetHeight);
      this.state.render.chunkColumns = Math.ceil(this.state.render.width / (1000 * this.state.view.scale)) + 1;
      this.state.render.chunkRows = Math.ceil(this.state.render.height / (1000 * this.state.view.scale)) + 1;
      this.renderer.resize();
      // this.environment?.refresh();
    }
  }

  async initialize (): Promise<void> {
    const container: HTMLElement | null = document?.getElementById(this.renderDomId);
    if (!container) {
      throw "Unable to load render container";
    }

    this.state.render.width = Math.ceil(container.offsetWidth);
    this.state.render.height = Math.ceil(container.offsetHeight);
    this.state.render.chunkColumns = Math.ceil(this.state.render.width / (1000 * this.state.view.scale)) + 1;
    this.state.render.chunkRows = Math.ceil(this.state.render.height / (1000 * this.state.view.scale)) + 1;

    this.renderer.configure();

    new ResizeObserver(() => this.handleResize()).observe(container);

    this.environment.initialize();
    this.input.initialize(container);

    this.configure();
    // this.application.loader
    //   .add('dunes', '/dunes.png')
    //   .add('grid', '/grid.png')
    //   .add('tree_01', '/trees/tree_01.png')
    //   .add('tree_02', '/trees/tree_02.png')
    //   .add('tree_38', '/trees/tree_38.png')
    //   .add('tree_46', '/trees/tree_46.png')
    //   .load(() => this.configure());
  }

  configure (): void {
    this.state.setAssets();
    this.environment.refresh();
    this.environment.refreshActors(true, this.state.simulationTimeSeconds(Date.now()));
    this.state.setRenderInitialized();
  }

  tick (renerTimeMs: number): void {
    if (!this.state.assets.loaded) return;

    if (this.state.view.dirty) {
      const simulationTimeSeconds = this.state.simulationTimeSeconds(Date.now());
      this.environment.refresh();
      this.environment.refreshActors(true, simulationTimeSeconds);
      this.accountManager.updateViewTarget();
      this.state.view.dirty = false;
    }
    else if (this.state.metadata.actor.activeActorIds.size) {
      const simulationTimeSeconds = this.state.simulationTimeSeconds(Date.now());
      this.environment.refreshActors(false, simulationTimeSeconds);
    }

    this.renderer.tick(renerTimeMs);
  }

}
