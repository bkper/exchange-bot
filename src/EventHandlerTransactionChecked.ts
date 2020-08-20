
class EventHandlerTransactionChecked extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected connectedTransactionFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, transaction: bkper.Transaction, connectedTransaction: Bkper.Transaction): string {
    let bookAnchor = super.buildBookAnchor(connectedBook);
    if (connectedTransaction.isPosted() && !connectedTransaction.isChecked()) {
      Logger.log('CHECKING...')
      connectedTransaction.check();
      let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())
      let record = `CHECKED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;
      return `${bookAnchor}: ${record}`;
    } else if (!connectedTransaction.isPosted() && this.isReadyToPost(connectedTransaction)) {
      Logger.log('POST AND CHECKING...')

      connectedTransaction.post().check();
      let record = `${connectedTransaction.getDate()} ${connectedTransaction.getAmount()} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;
      return `${bookAnchor}: ${record}`;
    } else {
      return `${bookAnchor}: DRAFT FOUND`;
    }
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
        connectedCreditAccount = this.createAccount(connectedBook, baseCreditAccount);
      } catch (err) {
        //OK
      }
    }
    let connectedDebitAccount = connectedBook.getAccount(baseDebitAccount.getName());
    if (connectedDebitAccount == null) {
      try {
        connectedDebitAccount = this.createAccount(connectedBook, baseDebitAccount);
      } catch (err) {
        //OK
      }
    }
    let amountDescription = super.extractAmountDescription_(connectedBook, baseCode, connectedCode, transaction);

    if (amountDescription.amount == null || amountDescription.amount == 0 || isNaN(amountDescription.amount) || !isFinite(amountDescription.amount)) {
      throw `Exchange rate NOT found for code  ${connectedCode} on ${transaction.date}`;
    }

    let newTransaction = connectedBook.newTransaction()
      .setDate(transaction.date)
      .setAmount(amountDescription.amount)
      .setCreditAccount(baseCreditAccount.getName())
      .setDebitAccount(baseDebitAccount.getName())
      .setDescription(amountDescription.description)
      .addRemoteId(transaction.id);

      let record = `${newTransaction.getDate()} ${newTransaction.getAmount()} ${baseCreditAccount.getName()} ${baseDebitAccount.getName()} ${amountDescription.description}`;
      Logger.log(record)

    if (this.isReadyToPost(newTransaction)) {
      newTransaction.post().check();
    } else {
      newTransaction.setDescription(`${newTransaction.getCreditAccount() == null ? baseCreditAccount.getName() : ''} ${newTransaction.getDebitAccount() == null ? baseDebitAccount.getName() : ''} ${newTransaction.getDescription()}`.trim())
      newTransaction.create();
    }

    return `${connectedBookAnchor}: ${record}`;
  }


  private isReadyToPost(newTransaction: Bkper.Transaction) {
    return newTransaction.getCreditAccount() != null && newTransaction.getDebitAccount() != null && newTransaction.getAmount() != null;
  }

  private createAccount(connectedBook: Bkper.Book, baseAccount: Bkper.Account): Bkper.Account {
    let newConnectedAccount = connectedBook.newAccount()
      .setName(baseAccount.getName())
      .setType(baseAccount.getType())
      .setProperties(baseAccount.getProperties());
    const baseGroups = baseAccount.getGroups();
    if (baseGroups) {
      baseGroups.forEach(baseGroup => {
        let connectedGroup = connectedBook.getGroup(baseGroup.getName());
        if (connectedGroup == null) {
          connectedGroup = connectedBook.newGroup().setName(baseGroup.getName()).setProperties(baseGroup.getProperties()).create();
        }
        newConnectedAccount.addGroup(connectedGroup);
      });
    }
    newConnectedAccount.create();
    return newConnectedAccount;
  }
}