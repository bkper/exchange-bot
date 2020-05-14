namespace RatesEndpointService_ {

  export function setRatesEndpoint(book: Bkper.Book, date: string): void {
    //Read from properties
    let ratesUrl = book.getProperty('exc_rates_url', 'exchange_rates_url');
    let ratesCacheStr = book.getProperty('exc_rates_cache', 'exchange_rates_cache');
    let ratesCache: number = ratesCacheStr != null && /^\d+$/.test(ratesCacheStr) ? parseInt(ratesCacheStr) : 0;

    //Default values
    if (ratesUrl == null || ratesUrl.trim() == '') {
      ratesUrl = "https://api.exchangeratesapi.io/${date}";
      ratesCache = 3600;
    }

    //deprecated
    ratesUrl = ratesUrl.replace("${transaction.date}", date);

    ratesUrl = ratesUrl.replace("${date}", date);

    ExchangeApp.setRatesEndpoint(ratesUrl, ratesCache);
  }
}