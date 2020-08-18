class EventHandlerAccountCreated extends EventHandlerAccount {

  protected connectedAccountNotFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, account: bkper.Account): string {

    let newAccount = connectedBook.newAccount()
    .setName(account.name)
    .setType(account.type as Bkper.AccountType)
    .setProperties(account.properties);
    if (account.groups) {
      account.groups.forEach(baseGroupId => {
        let baseGroup = baseBook.getGroup(baseGroupId);
        if (baseGroup) {
          let connectedGroup = connectedBook.getGroup(baseGroup.getName());
          if (connectedGroup) {
            newAccount.addGroup(connectedGroup);
          }
        }
      });
    }

    newAccount.create();
    
    return `CREATED ACCOUNT: ${newAccount.getName}`;
  }

  protected connectedAccountFound(baseBook: Bkper.Book, connectedBook: Bkper.Book, account: bkper.Account, connectedAccount: Bkper.Account): string {
    return `ACCOUNT ALREADY CREATED`;
  }

}