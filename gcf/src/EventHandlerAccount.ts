import { Account, Book } from "bkper";
import { getBaseCode } from "./BotService";
import { EventHandler } from "./EventHandler";

export abstract class EventHandlerAccount extends EventHandler {

  protected async processObject(baseBook: Book, connectedBook: Book, event: bkper.Event): Promise<string> {
    let connectedCode = getBaseCode(connectedBook);
    let account = event.data.object as bkper.Account;

    if (connectedCode != null && connectedCode != '') {

      let connectedAccount = await connectedBook.getAccount(account.name);
      if (connectedAccount == null && (event.data.previousAttributes && event.data.previousAttributes['name'])) {
        connectedAccount = await connectedBook.getAccount(event.data.previousAttributes['name']);
      }

      if (connectedAccount) {
        return this.connectedAccountFound(baseBook, connectedBook, account, connectedAccount);
      } else {
        return this.connectedAccountNotFound(baseBook, connectedBook, account);
      }
    }
    return null;
  }

  protected abstract connectedAccountNotFound(baseBook: Book, connectedBook: Book, account: bkper.Account): Promise<string>;

  protected abstract connectedAccountFound(baseBook: Book, connectedBook: Book, account: bkper.Account, connectedAccount: Account): Promise<string>;

}