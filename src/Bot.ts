BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

/**
 * Bkper trigger
 */
function onTransactionPosted(bookId: string, transaction: bkper.TransactionV2Payload): any {
  let book = BkperApp.getBook(bookId);
  let baseCurrency = book.getProperty('exchange_code');

  if (baseCurrency == null || baseCurrency == '') {
    return 'Please set the "exchange_code" property of this book.'
  }

  let creditAcc = book.getAccount(transaction.creditAccId);
  let debitAcc = book.getAccount(transaction.debitAccId);


  let responses: string[] = [];

  for (const key in book.getProperties()) {
    if (key.startsWith('exchange_') && key.endsWith('_book')) {
      let targetBook = BkperApp.getBook(book.getProperties()[key]);
      let targetCurrency = targetBook.getProperty('exchange_code');
      if (targetCurrency != null && targetCurrency != '') {
        if (targetBook.getAccount(creditAcc.getName()) == null) {
          targetBook.createAccount(creditAcc.getName());
        }
        if (targetBook.getAccount(debitAcc.getName()) == null) {
          targetBook.createAccount(debitAcc.getName());
        }
        let bookAnchor = builBookAnchor_(targetBook);
        let amountDescription = extractAmountDescription_(targetBook, baseCurrency, targetCurrency, transaction);
        let record = `${transaction.informedDateText} ${amountDescription.amount} ${transaction.creditAccName} ${transaction.debitAccName} ${amountDescription.description}`;
        targetBook.record(`${record} id:exchange_${transaction.id}`);
        responses.push(`${bookAnchor}: ${record}`);          
      }
    }
  }  
  return responses;
}

interface AmountDescription {
  amount: string;
  description: string;
}

function extractAmountDescription_(book: Bkper.Book, base: string, exchange_code:string, transaction: bkper.TransactionV2Payload): AmountDescription {
  let parts = transaction.description.split(' ');

  for (const part of parts) {
    if (part.startsWith(exchange_code)) {
      try {
        return {
          amount: part.replace(exchange_code, ''),
          description: transaction.description.replace(part, `${base}${transaction.amount}`)
        };
      } catch (error) {
        continue;
      }
    }
  }

  //Read from properties
  let ratesUrl = book.getProperty('exchange_rates_url');
  let ratesCacheStr = book.getProperty('exchange_rates_cache');
  let ratesCache: number = ratesCacheStr != null && /^\d+$/.test(ratesCacheStr) ? parseInt(ratesCacheStr) : 0;

  //Default values
  if (ratesUrl == null || ratesUrl.trim() == '') {
    ratesUrl = "https://api.exchangeratesapi.io/${transaction.date}";
    ratesCache = 3600;
  }

  ratesUrl = ratesUrl.replace("${transaction.date}", transaction.date);

  ExchangeApp.setRatesEndpoint(ratesUrl, ratesCache);
  
  let amount = ExchangeApp.exchange(transaction.amount).from(base).to(exchange_code).convert();

  return {
    amount: book.formatValue(amount),
    description: `${transaction.description}`,
  };
}

function builBookAnchor_(book: Bkper.Book) {
  return `<a href='https://app.bkper.com/b/#transactions:bookId=${book.getId()}' target='_blank'>${book.getName()}</a>`;
}



