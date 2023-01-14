
import * as PIXI from 'pixi.js';

import Noise from '~/plugins/ironwood/util/noise';
import State from '~/plugins/ironwood/state';


const TREE_CONFIGS = [{
  id: 'tree_01',
  size: 8
}, {
  id: 'tree_02',
  size: 4
}, {
  id: 'tree_38',
  size: 6
}, {
  id: 'tree_46',
  size: 20
}];


const MIN_SCALE = 1
const MAX_SCALE = 8

const CHUNK_SIZE = 1000
const CHUNK_COLUMN_COUNT = 10;
const CHUNK_ROW_COUNT = 10;

export default class Environment {
  application: PIXI.Application
  state: State;

  chunksByKey: any;
  chunksContainer: PIXI.Container;


  constructor (application: PIXI.Application, state: State) {
    this.application = application;
    this.state = state;

    this.chunksByKey = {};

    this.chunksContainer = new PIXI.Container();
    this.application.stage.addChild(this.chunksContainer);
  }

  initialize () {

  }

  createChunk () {

    const seed = Math.random();
    const pData = Noise.perlin(1000, 1000, {
      seed: `seed-${seed}-${0}-${0}`,
      octaveCount: 8,
      amplitude: 0.1,
      persistence: 0.5
    });
    // const sData = Noise.smooth(1000, 1000, 4, {seed: `seed-${seed}-${0}-${0}`});
    const texture = PIXI.Texture.fromBuffer(pData, 1000, 1000, {
      format: PIXI.FORMATS.RED,
      type: PIXI.TYPES.FLOAT
    });

    // this.application.loader.resources.dunes.texture
    const background = PIXI.Sprite.from(texture);

    const staticLayer = new PIXI.Graphics();
    const dynamicLayer = new PIXI.Graphics();

    staticLayer.beginFill(0xffffff);
    staticLayer.drawRect(5, 5, 100, 100);
    staticLayer.endFill();

    dynamicLayer.lineStyle(0);
    dynamicLayer.beginFill(0xffffff);
    dynamicLayer.drawCircle(75 + 10, 100 + 100, 0.5);
    dynamicLayer.endFill();

    const loadingLayer = new PIXI.Graphics();
    // loadingLayer.beginFill(0x000000, 0.8);
    // loadingLayer.drawRect(0, 0, 1000, 1000);
    // loadingLayer.endFill();

    const plants = new PIXI.Container();
    dynamicLayer.lineStyle(1);
    for (let y = 0; y < 1000; y += 25) {
      for (let x = 0; x < 1000; x += 25) {
        const config = TREE_CONFIGS[Math.floor(Math.random() * 4)];
        // const tree = PIXI.Sprite.from(this.application.loader.resources[config.id].texture);
        // tree.width = config.size;
        // tree.height = config.size;
        // tree.position.x = x + (Math.random() * 20 - 10);
        // tree.position.y = y + (Math.random() * 20 - 10);
        // plants.addChild(tree);
        dynamicLayer.beginFill(0x61865b); //566c57  //648564
        //dynamicLayer.beginTextureFill({ texture: this.application.loader.resources[config.id].texture });
        dynamicLayer.drawCircle(x + (Math.random() * 20 - 10), y + (Math.random() * 20 - 10), 10 + (Math.random() * 10 - 5));
        dynamicLayer.endFill();
      }
    }

    const chunk = new PIXI.Container();
    chunk.addChild(background);
    chunk.addChild(staticLayer);
    chunk.addChild(dynamicLayer);
    // chunk.addChild(plants);
    chunk.addChild(loadingLayer);

    return {
      chunk,
      background,
      staticLayer,
      dynamicLayer
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
        const chunkX = rawChunkX < 0 ? rawChunkX + CHUNK_COLUMN_COUNT : rawChunkX >= CHUNK_COLUMN_COUNT ? rawChunkX - CHUNK_COLUMN_COUNT : rawChunkX;
        const chunkY = rawChunkY < 0 ? rawChunkY + CHUNK_ROW_COUNT : rawChunkY >= CHUNK_ROW_COUNT ? rawChunkY - CHUNK_ROW_COUNT : rawChunkY;
        const chunkKey = `${chunkX}x${chunkY}`;

        if (!this.chunksByKey[chunkKey]) {
          this.chunksByKey[chunkKey] = this.createChunk();
        }

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


}
