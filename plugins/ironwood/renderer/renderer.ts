import * as PIXI from 'pixi.js';
import Stats from 'stats.js';

import State from '~/plugins/ironwood/state';

export default class Renderer {
  renderDomId: string;
  state: State;

  application: PIXI.Application;
  container: PIXI.Container;

  stats: Stats;

  constructor (renderDomId: string, state: State) {
    this.renderDomId = renderDomId;
    this.state = state;

    this.application = new PIXI.Application({
      antialias: true,
      width: this.state.render.width,
      height: this.state.render.height,
      backgroundColor : 0x000000
    });

    this.container = new PIXI.Container();

    this.stats = new Stats();
    this.stats.dom.classList.add('fps-meter');
  }

  configure () {
    this.application.renderer.resize(this.state.render.width, this.state.render.height);
    this.application.stage.addChild(this.container);

    const renderContainer: HTMLElement | null = document.getElementById(this.renderDomId);
    renderContainer?.appendChild(this.application.view);
    renderContainer?.appendChild(this.stats.dom);
  }

  resize (): void {
    this.application?.renderer?.resize(this.state.render.width, this.state.render.height);
  }

  tick (time: number): void {

    this.stats.update();
  }

}
