import { Account, AccountType, Book } from "bkper";
import { EventHandlerAccount } from "./EventHandlerAccount";

export class EventHandlerAccountCreatedOrUpdated extends EventHandlerAccount {

  public async connectedAccountNotFound(baseBook: Book, connectedBook: Book, baseAccount: bkper.Account): Promise<string> {

    let connectedAccount = connectedBook.newAccount();
    await this.syncAccounts(baseBook, connectedBook, baseAccount, connectedAccount);
    await connectedAccount.create();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: ACCOUNT ${connectedAccount.getName()} CREATED`;
  }

  protected async connectedAccountFound(baseBook: Book, connectedBook: Book, baseAccount: bkper.Account, connectedAccount: Account): Promise<string> {
    await this.syncAccounts(baseBook, connectedBook, baseAccount, connectedAccount);
    await connectedAccount.update();
    let bookAnchor = super.buildBookAnchor(connectedBook);
    return `${bookAnchor}: ACCOUNT ${connectedAccount.getName()} UPDATED`;
  }

  protected async syncAccounts(baseBook: Book, connectedBook: Book, baseAccount: bkper.Account, connectedAccount: Account) {
    connectedAccount.setGroups([]);
    connectedAccount.setName(baseAccount.name)
      .setType(baseAccount.type as AccountType)
      .setProperties(baseAccount.properties)
      .setArchived(baseAccount.archived);
    if (baseAccount.groups) {
      for (const baseGroupId of baseAccount.groups) {
        let baseGroup = await baseBook.getGroup(baseGroupId);
        if (baseGroup) {
          let connectedGroup = await connectedBook.getGroup(baseGroup.getName());
          if (connectedGroup == null) {
            connectedGroup = await connectedBook.newGroup()
              .setHidden(baseGroup.isHidden())
              .setName(baseGroup.getName())
              .setProperties(baseGroup.getProperties())
              .create();
          }
          connectedAccount.addGroup(connectedGroup);
        }
      }
    }
  }

}