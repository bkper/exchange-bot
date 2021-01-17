import { Bkper, Book } from "bkper";
import { AmountDescription } from "./EventHandlerTransaction";
import { convert } from "./exchange-service";
import { ExchangeRates } from "./ExchangeRates";

interface RatesEndpointConfig {
  url: string,
  cache: number
}

  export function getRatesEndpointConfig(book: Book, date: string, agent: string): RatesEndpointConfig {
    //Read from properties
    let ratesUrl = book.getProperty(EXC_RATES_URL_PROP, 'exchange_rates_url');
    let ratesCacheStr = book.getProperty(EXC_RATES_CACHE_PROP, 'exchange_rates_cache');
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

    if (ratesCache < 300) {
      ratesCache = 300;
    }

    return {
      url: ratesUrl,
      cache: ratesCache
    }
  }

  export async function getConnectedBooks(book: Book): Promise<Set<Book>> {
    if (book.getProperties() == null) {
      return new Set<Book>();
    }
    let books = new Set<Book>();

    //deprecated
    for (const key in book.getProperties()) {
      if ((key.startsWith('exc')) && key.endsWith('_book')) {
        books.add(await Bkper.getBook(book.getProperties()[key]));
      }
    }

    //deprecated
    var exc_books = book.getProperty('exc_books');
    if (exc_books != null && exc_books.trim() != '') {
      var bookIds = exc_books.split(/[ ,]+/);
      for (var bookId of bookIds) {
        if (bookId != null && bookId.trim().length > 10) {
          books.add(await Bkper.getBook(bookId));
        }
      }
    }

    let collectionBooks = book.getCollection() != null ? book.getCollection().getBooks() : null;
    if (collectionBooks) {
      for (const b of collectionBooks) {
        if ((b.getId() != book.getId()) && getBaseCode(b) != null) {
          books.add(b);
        }
      }
    }

    return books;
  }

  export function getBaseCode(book: Book): string {
    return book.getProperty('exc_code', 'exchange_code');
  }

  export function parseDateParam(dateParam: string) {
    var dateSplit = dateParam != null ? dateParam.split('-') : null;
  
    let year = new Number(dateSplit[0]).valueOf();
    let month = new Number(dateSplit[1]).valueOf() - 1;
    let day = new Number(dateSplit[2]).valueOf();
    var date = new Date(year, month, day, 13, 0, 0, 0);
  
    return date;
  }


  export async function extractAmountDescription_(book: Book, base: string, connectedCode: string, transaction: bkper.Transaction, ratesEndpointUrl: string, cacheInSeconds: number): Promise<AmountDescription> {

    let txExcCode = transaction.properties['exc_code'];
    let txExcAmount = transaction.properties['exc_amount'];
    let taxAmountProp = transaction.properties['tax_amount'] ? book.parseValue(transaction.properties['tax_amount']) : null;

    if (txExcAmount && txExcCode && txExcCode == connectedCode) {
      const amount = book.parseValue(txExcAmount);
      return {
        amount: amount,
        description: transaction.description,
        taxAmount: taxAmountProp ? (amount/+transaction.amount)*taxAmountProp : null
      };
    }


    let parts = transaction.description.split(' ');

    for (const part of parts) {
      if (part.startsWith(connectedCode)) {
        try {
          const amount = book.parseValue(part.replace(connectedCode, ''));
          let ret =  {
            amount: amount,
            description: transaction.description.replace(part, `${base}${transaction.amount}`),
            taxAmount: taxAmountProp ? (amount/+transaction.amount)*taxAmountProp : null
          };
          if (ret.amount && ret.amount != 0) {
            return ret;
          }
        } catch (error) {
          continue;
        }
      }
    }

    return {
      amount: await convert(+transaction.amount, base, connectedCode, ratesEndpointUrl, cacheInSeconds),
      description: `${transaction.description}`,
      taxAmount: taxAmountProp ? await convert(taxAmountProp, base, connectedCode, ratesEndpointUrl, cacheInSeconds) : null
    };
  }  
