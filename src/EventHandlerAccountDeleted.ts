class EventHandlerAccountDeleted extends EventHandlerAccount {
  protected connectedAccountNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, account: bkper.Account): string {
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: ACCOUNT ${account.name} NOT Found`;
  }
  protected connectedAccountFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, account: bkper.Account, connectedAccount: Bkper.Account): string {
    if (connectedAccount.hasTransactionPosted()) {
      connectedAccount.setArchived(true).update();
    } else {
      connectedAccount.remove();
    }
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: ACCOUNT ${connectedAccount.getName()} DELETED`;
  }
}
