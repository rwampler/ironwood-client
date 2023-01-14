import { MetadataResponse } from '~/plugins/ironwood/api-client';

export default class ServerMetadata {
  seed: string;
  chunkSize: number;
  chunkColumnCount: number;
  chunkRowCount: number;

  constructor (seed: string, chunkSize: number, chunkColumnCount: number, chunkRowCount: number) {
    this.seed = seed;
    this.chunkSize = chunkSize;
    this.chunkColumnCount = chunkColumnCount;
    this.chunkRowCount = chunkRowCount;
  }

  static from (metadata: MetadataResponse): ServerMetadata {
    return new ServerMetadata(metadata.seed, metadata.chunkSize, metadata.chunkColumnCount, metadata.chunkRowCount);
  }

}
