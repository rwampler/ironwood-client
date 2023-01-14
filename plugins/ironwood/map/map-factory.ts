import random from 'random';
import seedrandom from 'seedrandom';

import Noise from '~/plugins/ironwood/util/noise';


const DEFAULT_NOISE = {
  octaveCount: 8,
  amplitude: 0.1,
  persistence: 0.5
};

const HEIGHTMAP_RATIO = 10;

export type MapConfiguration = {
  seed: string;

  chunkColumnCount: number;
  chunkRowCount: number;
  chunkSize: number;
};

export default class MapFactory {

  static generate (configuration: MapConfiguration): any {

    const regionWidth = (configuration.chunkColumnCount * configuration.chunkSize) / HEIGHTMAP_RATIO;
    const regionHeight = (configuration.chunkRowCount * configuration.chunkSize) / HEIGHTMAP_RATIO;
    const regionHeightmap = Noise.perlin(regionWidth, regionHeight, Object.assign({ seed: `${configuration.seed}-heightmap` }, DEFAULT_NOISE)).map(v => v * 0.5);


  }



}
