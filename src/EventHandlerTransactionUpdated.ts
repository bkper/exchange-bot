class EventHandlerTransactionUpdated extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected connectedTransactionNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, transaction: bkper.Transaction): string {
    return null;
  }
  protected connectedTransactionFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, transaction: bkper.Transaction, connectedTransaction: Bkper.Transaction): string {
    let baseCreditAccount = baseBook.getAccount(transaction.creditAccount.id);
    let baseDebitAccount = baseBook.getAccount(transaction.debitAccount.id);
    let baseCode = Service_.getBaseCode(baseBook);
    let connectedCode = Service_.getBaseCode(connectedBook);

    let connectedCreditAccount = connectedBook.getAccount(baseCreditAccount.getName());
    if (connectedCreditAccount == null) {
      try {
        connectedCreditAccount = connectedBook.createAccount(baseCreditAccount.getName());
      } catch (err) {
        //OK
      }
    }
    let connectedDebitAccount = connectedBook.getAccount(baseDebitAccount.getName());
    if (connectedDebitAccount == null) {
      try {
        connectedDebitAccount = connectedBook.createAccount(baseDebitAccount.getName());
      } catch (err) {
        //OK
      }
    }
    let bookAnchor = super.buildBookAnchor(connectedBook);

    if (connectedTransaction.isChecked()) {
      connectedTransaction.uncheck();
    }

    let amountDescription = super.extractAmountDescription_(connectedBook, baseCode, connectedCode, transaction);
    connectedTransaction.setAmount(+amountDescription.amount)
    .setDescription(amountDescription.description)
    .setDate(transaction.date)
    .setCreditAccount(connectedCreditAccount)
    .setDebitAccount(connectedDebitAccount);

    let urls = transaction.urls;
    if (!urls) {
      urls = [];
    }

    if (connectedTransaction.getUrls()) {
      urls = urls.concat(connectedTransaction.getUrls())
    }

    if (transaction.files) {
      transaction.files.forEach(file => {
        Logger.log(`FILE: ${JSON.stringify(file)}`)
        urls.push(file.url)
      })
    }

    connectedTransaction
    .setUrls(urls);

    Logger.log(urls)

    connectedTransaction.update();
    

    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())

    let record = `EDITED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;

    return `${bookAnchor}: ${record}`;
  }

}
