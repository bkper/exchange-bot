class EventHandlerTransactionDeleted extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected connectedTransactionNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, transaction: bkper.Transaction): string {
    return null;
  }
  protected connectedTransactionFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, transaction: bkper.Transaction, connectedTransaction: Bkper.Transaction): string {
    let bookAnchor = super.buildBookAnchor(connectedBook);

    if (connectedTransaction.isChecked()) {
      connectedTransaction.uncheck();
    }

    connectedTransaction.remove();

    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())

    let record = `DELETED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;

    return `${bookAnchor}: ${record}`;
  }

}
