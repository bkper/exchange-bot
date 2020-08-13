namespace Service_ {

  interface AmountDescription {
    amount: number;
    description: string;
  }

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

  export function extractAmountDescription_(book: Bkper.Book, base: string, connectedCode: string, transaction: bkper.Transaction): AmountDescription {
    let parts = transaction.description.split(' ');

    for (const part of parts) {
      if (part.startsWith(connectedCode)) {
        try {
          return {
            amount: +part.replace(connectedCode, ''),
            description: transaction.description.replace(part, `${base}${transaction.amount}`)
          };
        } catch (error) {
          continue;
        }
      }
    }

    Service_.setRatesEndpoint(book, transaction.date, 'bot');
    let amount = ExchangeApp.exchange(+transaction.amount).from(base).to(connectedCode).convert();

    return {
      amount: amount,
      description: `${transaction.description}`,
    };
  }

  export function buildBookAnchor(book: Bkper.Book) {
    return `<a href='https://app.bkper.com/b/#transactions:bookId=${book.getId()}'>${book.getName()}</a>`;
  }

}