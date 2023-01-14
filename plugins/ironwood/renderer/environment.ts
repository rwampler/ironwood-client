
import * as PIXI from 'pixi.js';
import { graphicsUtils } from 'pixi.js';

import State from '~/plugins/ironwood/state';
import Actor from '../actor/actor';

const MIN_SCALE = 1
const MAX_SCALE = 8

const CHUNK_SIZE = 1000
const CHUNK_COLUMN_COUNT = 10;
const CHUNK_ROW_COUNT = 10;

export default class Environment {
  application: PIXI.Application
  state: State;

  chunksByKey: any;
  actorsById: any;

  chunksContainer: PIXI.Container;
  actorsContainer: PIXI.Container;

  constructor (application: PIXI.Application, state: State) {
    this.application = application;
    this.state = state;

    this.chunksByKey = {};
    this.actorsById = {};

    this.chunksContainer = new PIXI.Container();
    this.actorsContainer = new PIXI.Container();
    this.application.stage.addChild(this.chunksContainer);
    this.application.stage.addChild(this.actorsContainer);

    this.state.events.addListener('actor.add', (actor) => this.addActor(actor));
  }

  initialize (): void {
    for (let chunkY = 0; chunkY < CHUNK_ROW_COUNT; chunkY++) {
      for (let chunkX = 0; chunkX < CHUNK_COLUMN_COUNT; chunkX++) {
        this.chunksByKey[`${chunkX}x${chunkY}`] = this.createChunk(chunkX, chunkY);
      }
    }
  }

  addActor (actor: any): void {
    if (this.actorsById[actor.id]) {
      return;
    }

    const actorGraphic = new PIXI.Graphics();

    actorGraphic.lineStyle(.25, 0x000000, 1);

    // main body
    actorGraphic.drawCircle(0, 0, 1);

    // head
    actorGraphic.moveTo(-1, 0);
    actorGraphic.lineTo(1, 0);

    // pointer forward
    actorGraphic.moveTo(0, 0);
    actorGraphic.lineTo(0, -1.5);
    actorGraphic.closePath();

    // vision
    const visionStart = actor.vision.fov * 0.5 - Math.PI * 0.5;
    const visionEnd = visionStart + (2 * Math.PI) - actor.vision.fov;

    actorGraphic.lineStyle(.25, 0x00FFFF, 0.25);
    actorGraphic.beginFill(0x00FFFF, 0.05);
    actorGraphic.moveTo(0, 0);
    actorGraphic.arc(0, 0, actor.vision.range * 5, visionStart, visionEnd, true);
    actorGraphic.lineTo(0, 0);
    actorGraphic.closePath();

    actorGraphic.lineStyle(.25, 0x00FFFF, 0.5);
    actorGraphic.beginFill(0x00FFFF, 0.10);
    actorGraphic.moveTo(0, 0);
    actorGraphic.arc(0, 0, actor.vision.range, visionStart, visionEnd, true);
    actorGraphic.lineTo(0, 0);
    actorGraphic.closePath();

    console.log(actor);

    this.actorsContainer.addChild(actorGraphic);
    this.actorsById[actor.id] = actorGraphic;
  }

  createChunk (chunkX: number, chunkY: number): any {
    const staticLayer = new PIXI.Graphics();

    staticLayer.beginFill(0xffffff);
    staticLayer.drawRect(0, 0, 1000, 1000);
    staticLayer.endFill();

    staticLayer.lineStyle(1, 0x000000, 1);
    staticLayer.moveTo(500, 0);
    staticLayer.lineTo(500, 1000);
    staticLayer.moveTo(0, 500);
    staticLayer.lineTo(1000, 500);

    staticLayer.lineStyle(3, 0x000000, 1);
    staticLayer.moveTo(1000, 0);
    staticLayer.lineTo(1000, 1000);
    staticLayer.moveTo(0, 1000);
    staticLayer.lineTo(1000, 1000);

    const chunk = new PIXI.Container();
    chunk.addChild(staticLayer);

    return {
      chunk,
      staticLayer
    }
  }

  refresh () {
    if (!this.state.assets.loaded) return;

    const centerX = this.state.render.width / 2;
    const centerY = this.state.render.height / 2;

    const scaledChunkSize = CHUNK_SIZE * this.state.view.scale;

    const viewChunkX = Math.floor(this.state.view.x / CHUNK_SIZE);
    const viewChunkY = Math.floor(this.state.view.y / CHUNK_SIZE);
    const chunkOffsetX = (this.state.view.x * this.state.view.scale) % scaledChunkSize;
    const chunkOffsetY = (this.state.view.y * this.state.view.scale) % scaledChunkSize;

    const targetX = centerX - chunkOffsetX;
    const targetY = centerY - chunkOffsetY;

    const prefixChunkColumns = Math.ceil(Math.max(0, targetX) / scaledChunkSize);
    const prefixChunkRows = Math.ceil(Math.max(0, targetY) / scaledChunkSize);
    const suffixChunkColumns = Math.ceil(Math.max(0, this.state.render.width - targetX - scaledChunkSize) / scaledChunkSize);
    const suffixChunkRows = Math.ceil(Math.max(0, this.state.render.height - targetY - scaledChunkSize) / scaledChunkSize);

    const previousChunks = new Set(this.state.render.visibleChunks);
    for (let y = 0; y < (prefixChunkRows + suffixChunkRows + 1); y++) {
      for (let x = 0; x < (prefixChunkColumns + suffixChunkColumns + 1); x++) {
        const rawChunkX = x + viewChunkX - prefixChunkColumns;
        const rawChunkY = y + viewChunkY - prefixChunkRows;
        if (rawChunkX < 0 || rawChunkX >= CHUNK_COLUMN_COUNT || rawChunkY < 0 || rawChunkY >= CHUNK_ROW_COUNT) continue; // no wrapping
        const chunkX = rawChunkX < 0 ? rawChunkX + CHUNK_COLUMN_COUNT : rawChunkX >= CHUNK_COLUMN_COUNT ? rawChunkX - CHUNK_COLUMN_COUNT : rawChunkX;
        const chunkY = rawChunkY < 0 ? rawChunkY + CHUNK_ROW_COUNT : rawChunkY >= CHUNK_ROW_COUNT ? rawChunkY - CHUNK_ROW_COUNT : rawChunkY;
        const chunkKey = `${chunkX}x${chunkY}`;

        if (!previousChunks.has(chunkKey)) {
          this.chunksContainer.addChild(this.chunksByKey[chunkKey].chunk);
        }

        this.chunksByKey[chunkKey].chunk.scale.set(this.state.view.scale);
        this.chunksByKey[chunkKey].chunk.position.x = targetX - ((prefixChunkColumns - x) * scaledChunkSize);
        this.chunksByKey[chunkKey].chunk.position.y = targetY - ((prefixChunkRows - y) * scaledChunkSize);

        this.state.render.visibleChunks.add(chunkKey);
        previousChunks.delete(chunkKey);
      }
    }

    // console.log("No longer visible: " + [...previousChunks]);
    for (const chunkKey of [...previousChunks]) {
      this.state.render.visibleChunks.delete(chunkKey);
      this.chunksContainer.removeChild(this.chunksByKey[chunkKey].chunk);
    }
  }

  refreshActors (allActors: boolean, simulationTimeSeconds: number) {
    const centerX = this.state.render.width / 2;
    const centerY = this.state.render.height / 2;

    const actorIds = allActors ? Object.keys(this.state.metadata.actor.actorById) : Array.from(this.state.metadata.actor.activeActorIds);
    for (let actorId of actorIds) {
      const actor = this.state.metadata.actor.actorById[actorId];
      const actorGraphic = this.actorsById[actorId];
      if (actor && actorGraphic) {
        const hasActions = actor.cleanupActions(simulationTimeSeconds);
        if (!hasActions) {
          this.state.metadata.actor.activeActorIds.delete(actor.id);
        }

        const position = actor.getPosition(simulationTimeSeconds);
        const x = centerX + (position.x - this.state.view.x) * this.state.view.scale;
        const y = centerY + (position.y - this.state.view.y) * this.state.view.scale;
        if (x > 0 && y > 0 && x < this.state.render.width && y < this.state.render.height) {
          actorGraphic.visible = true;
          actorGraphic.x = x;
          actorGraphic.y = y;
          actorGraphic.scale.set(this.state.view.scale);
          actorGraphic.rotation = actor.getAzimuth(simulationTimeSeconds);
        }
        else {
          actorGraphic.visible = false;
        }
      }
      else {
        console.error("Unknown actor or graphic wasn't added, can't render");
      }
    }
  }

}
