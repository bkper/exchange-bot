class EventHandlerTransactionUpdated extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected connectedTransactionNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, baseTransaction: bkper.Transaction): string {
    return null;
  }
  protected connectedTransactionFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, baseTransaction: bkper.Transaction, connectedTransaction: Bkper.Transaction): string {
    let baseCreditAccount = baseBook.getAccount(baseTransaction.creditAccount.id);
    let baseDebitAccount = baseBook.getAccount(baseTransaction.debitAccount.id);
    let baseCode = BotService.getBaseCode(baseBook);
    let connectedCode = BotService.getBaseCode(connectedBook);

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


    let amountDescription = super.extractAmountDescription_(connectedBook, baseCode, connectedCode, baseTransaction);

    let bookAnchor = super.buildBookAnchor(connectedBook);

    this.updateConnectedTransaction(connectedTransaction, amountDescription, baseTransaction, connectedCreditAccount, connectedDebitAccount);

    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())

    let record = `EDITED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;

    return `${bookAnchor}: ${record}`;
  }



private updateConnectedTransaction(connectedTransaction: Bkper.Transaction, amountDescription: AmountDescription, transaction: bkper.Transaction, connectedCreditAccount: Bkper.Account, connectedDebitAccount: Bkper.Account) {
  if (connectedTransaction.isChecked()) {
    connectedTransaction.uncheck();
  }

  connectedTransaction.setAmount(amountDescription.amount)
    .setDescription(amountDescription.description)
    .setDate(transaction.date)
    .setProperties(transaction.properties)
    .setCreditAccount(connectedCreditAccount)
    .setDebitAccount(connectedDebitAccount);

  let urls = transaction.urls;
  if (!urls) {
    urls = [];
  }

  if (connectedTransaction.getUrls()) {
    urls = urls.concat(connectedTransaction.getUrls());
  }

  if (transaction.files) {
    transaction.files.forEach(file => {
      urls.push(file.url);
    });
  }

  connectedTransaction
    .setUrls(urls);

  connectedTransaction.update();
}



}

