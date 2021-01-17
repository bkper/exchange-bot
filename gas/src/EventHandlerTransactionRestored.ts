class EventHandlerTransactionRestored extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id} is:trashed`;
  }

  protected connectedTransactionNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, transaction: bkper.Transaction): string {
    return null;
  }
  protected connectedTransactionFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, transaction: bkper.Transaction, connectedTransaction: Bkper.Transaction): string {
    let bookAnchor = super.buildBookAnchor(connectedBook);

    connectedTransaction.restore();

    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())

    let record = `RESTORED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;

    return `${bookAnchor}: ${record}`;
  }

}
