import ApiClient, { MetadataResponse } from '~/plugins/ironwood/api-client';
import State from '~/plugins/ironwood/state';
import ServerMetadata from '~/plugins/ironwood/server/server-metadata';
import Account from '~/plugins/ironwood/account/account';


export default class ServerManager {
  apiClient: ApiClient;
  state: State;

  constructor (apiClient: ApiClient, state: State) {
    this.apiClient = apiClient;
    this.state = state;
  }

  async loadMetadata (): Promise<ServerMetadata> {
    const response: MetadataResponse = await this.apiClient.getMetadata();
    const metadata: ServerMetadata = ServerMetadata.from(response);
    this.state.setServerMetadata(metadata);

    if (response.account) {
      this.state.setAccount(Account.from(response.account));
      this.connect();
    }

    return metadata;
  }

  connect (): void {
    this.apiClient.connect();
  }

}
