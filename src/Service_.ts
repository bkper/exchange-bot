namespace Service_ {

  export function setRatesEndpoint(book: Bkper.Book, date: string, agent: string): void {
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
    ratesUrl = ratesUrl.replace("${agent}", agent);

    ExchangeApp.setRatesEndpoint(ratesUrl, ratesCache);
  }

  export function getConnectedBooks(book: Bkper.Book): Bkper.Book[] {
    if (book.getProperties() == null) {
      return [];
    }
    let books = new Array<Bkper.Book>();
    for (const key in book.getProperties()) {
      if ((key.startsWith('exc')) && key.endsWith('_book')) {
        books.push(BkperApp.getBook(book.getProperties()[key]));
      }
    }
    return books;
  }

  export function getBaseCode(book: Bkper.Book): string {
    return book.getProperty('exc_code', 'exchange_code');
  }
}