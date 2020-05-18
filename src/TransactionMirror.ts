BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

/**
 * Bkper trigger
 */
function onTransactionPosted(bookId: string, transaction: bkper.TransactionV2Payload): any {
  let book = BkperApp.getBook(bookId);
  let baseCode = Service_.getBaseCode(book);

  if (baseCode == null || baseCode == '') {
    return 'Please set the "exc_code" property of this book.'
  }

  let creditAcc = book.getAccount(transaction.creditAccId);
  let debitAcc = book.getAccount(transaction.debitAccId);


  let responses: string[] = [];

  let connectedBooks = Service_.getConnectedBooks(book);

  connectedBooks.forEach(connectedBook => {
    let connectedCode = Service_.getBaseCode(connectedBook);
    if (connectedCode != null && connectedCode != '') {
      if (connectedBook.getAccount(creditAcc.getName()) == null) {
        connectedBook.createAccount(creditAcc.getName());
      }
      if (connectedBook.getAccount(debitAcc.getName()) == null) {
        connectedBook.createAccount(debitAcc.getName());
      }
      let bookAnchor = buildBookAnchor_(connectedBook);
      let amountDescription = extractAmountDescription_(connectedBook, baseCode, connectedCode, transaction);
      let record = `${transaction.informedDateText} ${amountDescription.amount} ${transaction.creditAccName} ${transaction.debitAccName} ${amountDescription.description}`;
      connectedBook.record(`${record} id:exchange_${transaction.id}`);
      responses.push(`${bookAnchor}: ${record}`);          
    }
  })  

  return responses;
}

interface AmountDescription {
  amount: string;
  description: string;
}

function extractAmountDescription_(book: Bkper.Book, base: string, connectedCode:string, transaction: bkper.TransactionV2Payload): AmountDescription {
  let parts = transaction.description.split(' ');

  for (const part of parts) {
    if (part.startsWith(connectedCode)) {
      try {
        return {
          amount: part.replace(connectedCode, ''),
          description: transaction.description.replace(part, `${base}${transaction.amount}`)
        };
      } catch (error) {
        continue;
      }
    }
  }

  Service_.setRatesEndpoint(book, transaction.date, 'bot');
  let amount = ExchangeApp.exchange(transaction.amount).from(base).to(connectedCode).convert();

  return {
    amount: book.formatValue(amount),
    description: `${transaction.description}`,
  };
}

function buildBookAnchor_(book: Bkper.Book) {
  return `<a href='https://app.bkper.com/b/#transactions:bookId=${book.getId()}'>${book.getName()}</a>`;
}



