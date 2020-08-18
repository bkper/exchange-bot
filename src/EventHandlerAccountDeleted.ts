class EventHandlerAccountDeleted extends EventHandlerAccount {
  protected connectedAccountNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, account: bkper.Account): string {
    return `ACCOUNT NOT YET FOUND`;
  }
  protected connectedAccountFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, account: bkper.Account, connectedAccount: Bkper.Account): string {
    return `ACCOUNT FOUND`;
  }
}
