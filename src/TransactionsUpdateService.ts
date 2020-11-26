namespace TransactionsUpdateService {

  export function updateTransactions(bookId: any, dateParam: string, exchangeRates: Bkper.ExchangeRates): void {
    let book = BkperApp.getBook(bookId);
    let connectedBooks = BotService.getConnectedBooks(book);
    let booksToAudit: Bkper.Book[] = []
    connectedBooks.add(book);
    connectedBooks.forEach(connectedBook => {
      updateTransactionsForBook(connectedBook, dateParam, exchangeRates);
      booksToAudit.push(connectedBook);
    });

    booksToAudit.forEach(book => book.audit());
  }

  function updateTransactionsForBook(baseBook: Bkper.Book, dateParam: string, exchangeRates: Bkper.ExchangeRates) {
    let connectedBooks = BotService.getConnectedBooks(baseBook);
    let baseCode = BotService.getBaseCode(baseBook);

    var date = BotService.parseDateParam(dateParam, baseBook);

    let iterator = baseBook.getTransactions(`on: ${baseBook.formatDate(date)}`)
    while (iterator.hasNext()) {
      let baseTransaction = iterator.next();
      if (baseTransaction.getAgentId() != 'exchange-bot') {
        connectedBooks.forEach(connectedBook => {
          let connectedCode = BotService.getBaseCode(connectedBook);
          let connectedIterator = connectedBook.getTransactions(`remoteId:${baseTransaction.getId()}`);
          if (connectedIterator.hasNext()) {
            let connectedTransaction = connectedIterator.next();
            let baseTransactionRaw: bkper.Transaction = {
              properties: baseTransaction.getProperties(),
              description: baseTransaction.getDescription(),
              amount: baseTransaction.getAmount()+'',
            }
            let amountDescription = BotService.extractAmountDescription_(connectedBook, baseCode, connectedCode, baseTransactionRaw, exchangeRates);
            if (connectedTransaction.getAmount() != amountDescription.amount) {
              if (connectedTransaction.isChecked()) {
                connectedTransaction = connectedTransaction.uncheck()
              }
              connectedTransaction.setAmount(amountDescription.amount).update().check();
            }
          }
    
        });
        
      }
    }

  }
  

}