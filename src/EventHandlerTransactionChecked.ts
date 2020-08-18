
class EventHandlerTransactionChecked extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected connectedTransactionFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, transaction: bkper.Transaction, connectedTransaction: Bkper.Transaction): string {
    let bookAnchor = super.buildBookAnchor(connectedBook);
    connectedTransaction.check();
    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())
    let record = `CHECKED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;
    return `${bookAnchor}: ${record}`;
  }

  protected connectedTransactionNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, transaction: bkper.Transaction): string {
    let baseCreditAccount = baseBook.getAccount(transaction.creditAccount.id);
    let baseDebitAccount = baseBook.getAccount(transaction.debitAccount.id);
    let baseCode = Service_.getBaseCode(baseBook);
    let connectedCode = Service_.getBaseCode(connectedBook);
    let connectedBookAnchor = super.buildBookAnchor(connectedBook);

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
    let amountDescription = super.extractAmountDescription_(connectedBook, baseCode, connectedCode, transaction);
    let amountFormatted = connectedBook.formatValue(amountDescription.amount)

    let record = `${transaction.dateFormatted} ${amountFormatted} ${baseCreditAccount.getName()} ${baseDebitAccount.getName()} ${amountDescription.description}`;
    connectedBook.record(`${record} id:${transaction.id}`);
    return `${connectedBookAnchor}: ${record}`;
  }

}