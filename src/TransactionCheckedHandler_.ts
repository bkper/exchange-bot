namespace TransactionCheckedHandler_ {

  export function handleTransactionChecked(event: bkper.Event): string[] | string {

    let bookId = event.bookId;

    let book = BkperApp.getBook(bookId);
    let baseCode = Service_.getBaseCode(book);

    if (baseCode == null || baseCode == '') {
      return 'Please set the "exc_code" property of this book.'
    }

    let operation = event.data.object as bkper.TransactionOperation;
    let transaction = operation.transaction;

    let creditAcc = book.getAccount(transaction.creditAccount.id);
    let debitAcc = book.getAccount(transaction.debitAccount.id);

    let responses: string[] = [];

    let connectedBooks = Service_.getConnectedBooks(book);

    connectedBooks.forEach(connectedBook => {
      let connectedCode = Service_.getBaseCode(connectedBook);
      if (connectedCode != null && connectedCode != '') {
        let connectedCreditAccount = connectedBook.getAccount(creditAcc.getName());
        if (connectedCreditAccount == null) {
          try {
            connectedCreditAccount = connectedBook.createAccount(creditAcc.getName());
          } catch (err) {
            //OK
          }
        }
        let connectedDebitAccount = connectedBook.getAccount(debitAcc.getName());
        if (connectedDebitAccount == null) {
          try {
            connectedDebitAccount = connectedBook.createAccount(debitAcc.getName());
          } catch (err) {
            //OK
          }
        }
        let bookAnchor = Service_.buildBookAnchor(connectedBook);
        let amountDescription = Service_.extractAmountDescription_(connectedBook, baseCode, connectedCode, transaction);
        let amountFormatted = connectedBook.formatValue(amountDescription.amount)

        let record = `${transaction.dateFormatted} ${amountFormatted} ${creditAcc.getName()} ${debitAcc.getName()} ${amountDescription.description}`;
        connectedBook.record(`${record} id:${transaction.id}`);
        responses.push(`${bookAnchor}: ${record}`);
      }
    })

    return responses;
  }

}