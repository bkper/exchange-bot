import { Account, Amount, Bkper, Book, Group } from "bkper";
import { EXC_AMOUNT_PROP, EXC_BASE_PROP, EXC_CODE_PROP, EXC_RATE_PROP, EXC_RATES_CACHE_PROP, EXC_RATES_URL_PROP } from "./constants";
import { AmountDescription } from "./EventHandlerTransaction";
import { convert } from "./exchange-service";

interface RatesEndpointConfig {
  url: string,
  cache: number
}

  export function getRatesEndpointConfig(book: Book, date: string, agent: string): RatesEndpointConfig {
    //Read from properties
    let ratesUrl = book.getProperty(EXC_RATES_URL_PROP, 'exchange_rates_url');
    let ratesCacheStr = book.getProperty(EXC_RATES_CACHE_PROP, 'exchange_rates_cache');
    // let ratesCache: number = ratesCacheStr != null && /^\d+$/.test(ratesCacheStr) ? parseInt(ratesCacheStr) : 0;

    //Default values
    if (ratesUrl == null || ratesUrl.trim() == '') {
      ratesUrl = "https://openexchangerates.org/api/historical/${date}.json?show_alternative=true&app_id="+process.env.open_exchange_rates_app_id;
      // ratesCache = 3600;
    }

    //deprecated
    ratesUrl = ratesUrl.replace("${transaction.date}", date);

    ratesUrl = ratesUrl.replace("${date}", date);
    ratesUrl = ratesUrl.replace("${agent}", agent);

    // if (ratesCache < 300) {
    //   ratesCache = 300;
    // }

    return {
      url: ratesUrl,
      cache: 3600
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
        if ((b.getId() != book.getId()) && getBaseCode(b) != null && getBaseCode(b) != 'TEMPLATE') {
          books.add(b);
        }
      }
    }

    return books;
  }

  export function isBaseBook(book: Book): boolean {
    if (book.getProperty(EXC_BASE_PROP)) {
      return true;
    } else {
      return false;
    }
  }

  export function hasBaseBookInCollection(book: Book): boolean {
    let collectionBooks = book.getCollection() != null ? book.getCollection().getBooks() : null;
    if (collectionBooks) {
      for (const b of collectionBooks) {
        if (isBaseBook(b)) {
          return true;
        }
      }
    }

    return false;
  }

  export function getBaseCode(book: Book): string {
    return book.getProperty(EXC_CODE_PROP, 'exchange_code');
  }

  export function parseDateParam(dateParam: string) {
    var dateSplit = dateParam != null ? dateParam.split('-') : null;
  
    let year = new Number(dateSplit[0]).valueOf();
    let month = new Number(dateSplit[1]).valueOf() - 1;
    let day = new Number(dateSplit[2]).valueOf();
    var date = new Date(year, month, day, 13, 0, 0, 0);
  
    return date;
  }


  export async function extractAmountDescription_(baseBook: Book, connectedBook: Book, base: string, connectedCode: string, transaction: bkper.Transaction, ratesEndpointUrl: string, cacheInSeconds: number): Promise<AmountDescription> {
    let amountDescription = await getAmountDescription_(baseBook, connectedBook, base, connectedCode, transaction, ratesEndpointUrl, cacheInSeconds);
    amountDescription.amount = amountDescription.amount.round(8);
    amountDescription.excBaseRate = amountDescription.amount.div(transaction.amount);
    return amountDescription;
  }

  async function getAmountDescription_(baseBook: Book, connectedBook: Book, base: string, connectedCode: string, transaction: bkper.Transaction, ratesEndpointUrl: string, cacheInSeconds: number): Promise<AmountDescription> {

    let txExcAmount = transaction.properties[EXC_AMOUNT_PROP];
    let txExcRate = transaction.properties[EXC_RATE_PROP];
    let txExcCode = transaction.properties[EXC_CODE_PROP];

    if (txExcAmount && (connectedCode == txExcCode || match(baseBook, connectedCode, transaction))) {
      const amount = connectedBook.parseValue(txExcAmount);
      return {
        amount: amount,
        excBaseCode: base,
        description: transaction.description,
      };
    }

    if (txExcRate && (connectedCode == txExcCode || match(baseBook, connectedCode, transaction))) {
      const excRate = connectedBook.parseValue(txExcRate);
      return {
        amount: excRate.times(transaction.amount),
        excBaseCode: base,
        description: transaction.description,
      };
    }


    let parts = transaction.description.split(' ');

    for (const part of parts) {
      if (part.startsWith(connectedCode)) {
        try {
          const amount = connectedBook.parseValue(part.replace(connectedCode, ''));
          let ret: AmountDescription =  {
            amount: amount,
            excBaseCode: base,
            description: transaction.description.replace(part, `${base}${transaction.amount}`),
          };
          if (ret.amount) {
            return ret;
          }
        } catch (error) {
          continue;
        }
      }
    }

    const convertedAmount = await convert(new Amount(transaction.amount), base, connectedCode, ratesEndpointUrl, cacheInSeconds);

    return {
      amount: convertedAmount.amount,
      excBaseCode: convertedAmount.base,
      description: `${transaction.description}`,
    };
  }  



  export function match(baseBook: Book, connectedCode: string, transaction: bkper.Transaction): boolean {


    const creditGroups = transaction.creditAccount.groups;
    const debitGroups = transaction.debitAccount.groups;

    if (creditGroups != null) {
      for (const group of creditGroups) {
        if (group.name == connectedCode) {
          return true;
        }
        if (group.properties[EXC_CODE_PROP] == connectedCode) {
          return true;
        }
      }
    }

    if (debitGroups != null) {
      for (const group of debitGroups) {
        if (group.name == connectedCode) {
          return true;
        }
        if (group.properties[EXC_CODE_PROP] == connectedCode) {
          return true;
        }
      }
    }
    return false;
  }
  
