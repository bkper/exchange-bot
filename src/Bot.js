BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

function onTransactionPosted(bookId, transaction) {
  return "Got it. Thanks :-) ";
}

function onTransactionChecked(bookId, transaction) {
  return onTransactionPosted(bookId, transaction);
}

function onTransactionUnchecked(bookId, transaction) {
  return onTransactionPosted(bookId, transaction);
}

function getTargetBook(sourceBook) {
  let targetBookId = sourceBook.getProperty('')
}

function getRate_(base, currency) {
  let latestRates = getLatestRates_(base);
  return latestRates.rates[currency];
}

function getLatestRates_(base) {
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
    return latests[base];
}

