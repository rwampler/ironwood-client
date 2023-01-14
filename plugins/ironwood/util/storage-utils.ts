
export default class StorageUtils {

  static setLocalStorage (key: string, value: string | null): void {
    if (value?.length) {
      localStorage?.setItem(key, value);
    }
    else {
      localStorage?.removeItem(key);
    }
  }

}



