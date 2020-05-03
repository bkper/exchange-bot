BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

/**
 * Bkper trigger
 */
function onTransactionPosted(bookId: string, transaction: bkper.TransactionV2Payload): any {
  let book = BkperApp.getBook(bookId);
  let baseCurrency = book.getProperty('currency');

  if (baseCurrency == null || baseCurrency == '') {
    return 'Please set the "currency" property of this book.'
  }

  let creditAcc = book.getAccount(transaction.creditAccId);
  let debitAcc = book.getAccount(transaction.debitAccId);

  let creditAccCurrency = creditAcc.getProperty('currency');
  let debitAccCurrency = debitAcc.getProperty('currency');

  let responses: string[] = [];

  for (const key in book.getProperties()) {
    if (key.startsWith('currency_') && key.endsWith('_book')) {
      let targetBook = BkperApp.getBook(book.getProperties()[key]);
      let targetCurrency = targetBook.getProperty('currency');
      if (targetCurrency != null && targetCurrency != '') {
        if (targetBook.getAccount(creditAcc.getName()) == null) {
          targetBook.createAccount(creditAcc.getName());
        }
        if (targetBook.getAccount(debitAcc.getName()) == null) {
          targetBook.createAccount(debitAcc.getName());
        }

        if (creditAccCurrency != null && creditAccCurrency.trim() != '' && debitAccCurrency != null && debitAccCurrency.trim() != '') {
          //Moving between currency accounts
          let amountDescription = extractAmount_(baseCurrency, targetCurrency, transaction);
          let bookAnchor = builBookAnchor_(targetBook);
          if (amountDescription != null) {
            let record = `${transaction.informedDateText} ${amountDescription.amount} ${transaction.creditAccName} ${transaction.debitAccName} ${amountDescription.description}`;
            targetBook.record(`${record} id:currency_${transaction.id}`);
            responses.push(`${bookAnchor}: ${record}`);          
          } else {
            responses.push(`${bookAnchor}: No ${targetCurrency}### found in transaction description`);          
          }
        } else {
          let rate = getRate_(baseCurrency, targetCurrency);
          let amount = rate * transaction.amount;
          let record = `${transaction.informedDateText} ${targetBook.formatValue(amount)} ${transaction.creditAccName} ${transaction.debitAccName} ${transaction.description}`;
          targetBook.record(`${record} id:currency_${transaction.id}`);
          let bookAnchor = builBookAnchor_(targetBook);
          responses.push(`${bookAnchor}: ${record}`);          
        }
      }
    }
  }  
  return responses;
}

interface AmountDescription {
  amount: string;
  description: string;
}

function extractAmount_(base: string, currency:string, transaction: bkper.TransactionV2Payload): AmountDescription {
  let parts = transaction.description.split(' ');

  for (const part of parts) {
    if (part.startsWith(currency)) {
      try {
        return {
          amount: part.replace(currency, ''),
          description: transaction.description.replace(part, `${base}${transaction.amount}`)
        };
      } catch (error) {
        continue;
      }
    }
  }
  return null;
}


function builBookAnchor_(book: bkper.Book) {
  return `<a href='https://app.bkper.com/b/#transactions:bookId=${book.getId()}' target='_blank'>${book.getName()}</a>`;
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


