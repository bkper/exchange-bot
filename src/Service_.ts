interface RatesEndpointConfig {
  url: string,
  cache: number
}

namespace Service_ {

  export function getRatesEndpointConfig(book: Bkper.Book, date: string, agent: string): RatesEndpointConfig {
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

    return {
      url: ratesUrl,
      cache: ratesCache
    }
  }

  export function getConnectedBooks(book: Bkper.Book): Set<Bkper.Book> {
    if (book.getProperties() == null) {
      return new Set<Bkper.Book>();
    }
    let books = new Set<Bkper.Book>();

    //deprecated
    for (const key in book.getProperties()) {
      if ((key.startsWith('exc')) && key.endsWith('_book')) {
        books.add(BkperApp.getBook(book.getProperties()[key]));
      }
    }

    //deprecated
    var exc_books = book.getProperty('exc_books');
    if (exc_books != null && exc_books.trim() != '') {
      var bookIds = exc_books.split(/[ ,]+/);
      for (var bookId of bookIds) {
        if (bookId != null && bookId.trim().length > 10) {
          books.add(BkperApp.getBook(bookId));
        }
      }
    }

    let collectionBooks = book.getCollection() != null ? book.getCollection().getBooks() : null;
    if (collectionBooks) {
      for (const b of collectionBooks) {
        if (b.getId() != book.getId()) {
          books.add(b);
        }
      }
    }

    return books;
  }

  export function getBaseCode(book: Bkper.Book): string {
    return book.getProperty('exc_code', 'exchange_code');
  }



}