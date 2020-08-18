abstract class EventHandlerAccount extends EventHandler {

  protected processObject(baseBook: Bkper.Book, connectedBook: Bkper.Book, event: bkper.Event): string {
    let connectedCode = Service_.getBaseCode(connectedBook);
    let account = event.data.object as bkper.Account;

    if (connectedCode != null && connectedCode != '') {

      let name = event.data.previousAttributes['name'] ? event.data.previousAttributes['name'] : account.name;

      let connectedAccount = connectedBook.getAccount(name);
      if (connectedAccount) {
        return this.connectedAccountFound(baseBook, connectedBook, account, connectedAccount);
      } else {
        return this.connectedAccountNotFound(baseBook, connectedBook, account);
      }
    }
  }

  protected abstract connectedAccountNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, account: bkper.Account): string;

  protected abstract connectedAccountFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, account: bkper.Account, connectedAccount: Bkper.Account): string;

}