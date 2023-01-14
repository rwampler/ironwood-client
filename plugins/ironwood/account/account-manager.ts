import Account from '~/plugins/ironwood/account/account';
import ApiClient from '~/plugins/ironwood/api-client';
import State from '~/plugins/ironwood/state';


export default class AccountManager {
  apiClient: ApiClient;
  state: State;

  constructor (apiClient: ApiClient, state: State) {
    this.apiClient = apiClient;
    this.state = state;
  }


  async create (username: string, password: string): Promise<Account> {
    const accountResponse = await this.apiClient.createAccount(username, password);
    if (!accountResponse.accessToken?.length) {
      throw Error('NO_AUTH_TOKEN');
    }

    const account = Account.from(accountResponse);
    this.state.setAuthorization(accountResponse.accessToken, accountResponse.refreshToken);
    this.state.setAccount(account);
    return account;
  }

  async login (username: string, password: string): Promise<Account> {
    const accountResponse = await this.apiClient.loginAccount(username, password);
    if (!accountResponse.accessToken?.length) {
      throw Error('NO_AUTH_TOKEN');
    }

    const account = Account.from(accountResponse);
    this.state.setAuthorization(accountResponse.accessToken, accountResponse.refreshToken);
    this.state.setAccount(account);
    return account;
  }

  async logout (): Promise<void> {
    await this.apiClient.logoutAccount();
    this.state.clearAuthorization();
    this.state.setAccount(null);
  }

  updateViewTarget (): void {
    if (this.state.account) {
      this.apiClient.updateViewTarget(this.state.view.x, this.state.view.y);
    }
  }

}
