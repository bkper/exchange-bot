BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

function onTransactionPosted(bookId: string, transaction: bkper.TransactionV2Payload) {
  let book = BkperApp.getBook(bookId);
  let baseCurrency = book.getProperty('currency');
  let rate = getRate_(baseCurrency, 'uyu');
  return `Converted: ${rate * transaction.amount}`;
}

function onTransactionChecked(bookId: string, transaction: bkper.TransactionV2Payload) {
  return onTransactionPosted(bookId, transaction);
}

function onTransactionUnchecked(bookId: string, transaction: bkper.TransactionV2Payload) {
  return onTransactionPosted(bookId, transaction);
}

function getTargetBook(sourceBook: bkper.Book) {
  let targetBookId = sourceBook.getProperty('currency_uyu_book')

}

function getRate_(base:string, currency:string) {
  let latestRates = getLatestRates_(base);
  currency = currency.toUpperCase();
  //@ts-ignore
  return latestRates.rates[currency];
}

interface LatestRates {
  "base": string,
  "date": string,
  "rates": Map<string, number>
}

function getLatestRates_(base: string): LatestRates {
  base = base.toLowerCase();
  //TODO get from the API's
  let latests = {
    usd: {
      "base": "USD",
      "date": "2019-04-27",
      "rates": {
        "BRL": 5.59,
        "UYU": 43.19,
        }
      },
    brl: {
      "base": "BRL",
      "date": "2019-04-27",
      "rates": {
        "USD": 0.18,
        "UYU": 7.69,
        }
      },
    uyu: {
      "base": "UYU",
      "date": "2019-04-27",
      "rates": {
        "USD": 0.023,
        "BRL": 0.13,
        }
      },
    }
    //@ts-ignore
    return latests[base] as LatestRates;
}


