abstract class EventHandlerAccount extends EventHandler {

  protected processObject(baseBook: Bkper.Book, connectedBook: Bkper.Book, event: bkper.Event): string {
    let connectedCode = BotService.getBaseCode(connectedBook);
    let account = event.data.object as bkper.Account;

    if (connectedCode != null && connectedCode != '') {

      let connectedAccount = connectedBook.getAccount(account.name);
      if (connectedAccount == null && (event.data.previousAttributes && event.data.previousAttributes['name'])) {
        connectedAccount = connectedBook.getAccount(event.data.previousAttributes['name']);
      }

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