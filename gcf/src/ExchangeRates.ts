/**
 * The Rates to be applied when exchanging values
 */
export interface ExchangeRates {
  base: string;
  date: string;
  rates: {
    [key: string]: number|string;
  }
}