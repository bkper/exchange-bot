class EventHandlerAccountCreatedOrUpdated extends EventHandlerAccount {

  public connectedAccountNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, baseAccount: bkper.Account): string {

    let connectedAccount = connectedBook.newAccount();
    this.syncAccounts(baseBook, connectedBook, baseAccount, connectedAccount);
    connectedAccount.create();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: ACCOUNT ${connectedAccount.getName()} CREATED`;
  }

  protected connectedAccountFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, baseAccount: bkper.Account, connectedAccount: Bkper.Account): string {
    this.syncAccounts(baseBook, connectedBook, baseAccount, connectedAccount);
    connectedAccount.update();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: ACCOUNT ${connectedAccount.getName()} UPDATED`;
  }

  protected syncAccounts(baseBook: Bkper.Book, connectedBook: Bkper.Book, baseAccount: bkper.Account, connectedAccount: Bkper.Account) {
    connectedAccount.setGroups([]);
    connectedAccount.setName(baseAccount.name)
      .setType(baseAccount.type as Bkper.AccountType)
      .setProperties(baseAccount.properties)
      .setArchived(baseAccount.archived);
    if (baseAccount.groups) {
      baseAccount.groups.forEach(baseGroupId => {
        let baseGroup = baseBook.getGroup(baseGroupId);
        if (baseGroup) {
          let connectedGroup = connectedBook.getGroup(baseGroup.getName());
          if (connectedGroup == null) {
            connectedGroup = connectedBook.newGroup().setName(baseGroup.getName()).setProperties(baseGroup.getProperties()).create();
          }
          connectedAccount.addGroup(connectedGroup);
        }
      });
    }
  }

}