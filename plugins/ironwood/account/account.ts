import ApiClient, { AccountInfo } from '~/plugins/ironwood/api-client';


export default class Account {
  id: string;
  username: string;

  constructor (id: string, username: string) {
    this.id = id;
    this.username = username;
  }

  static from (info: AccountInfo): Account {
    return new Account(info.id, info.username);
  }

}
