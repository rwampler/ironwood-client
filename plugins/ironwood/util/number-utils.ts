
export default class NumberUtils {

  static round (value: number, places: number): number {
    const exponent = Math.pow(10, places);
    return Math.round((value + Number.EPSILON) * exponent) / exponent;
  }

}



