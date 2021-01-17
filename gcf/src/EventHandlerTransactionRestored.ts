import { Book, Transaction } from "bkper";
import { EventHandlerTransaction } from "./EventHandlerTransaction";

export class EventHandlerTransactionRestored extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id} is:trashed`;
  }

  protected connectedTransactionNotFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction): Promise<string> {
    return null;
  }
  protected async connectedTransactionFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction, connectedTransaction: Transaction): Promise<string> {
    let bookAnchor = super.buildBookAnchor(connectedBook);

    await connectedTransaction.restore();

    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())

    let record = `RESTORED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${await connectedTransaction.getCreditAccountName()} ${await connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;

    return `${bookAnchor}: ${record}`;
  }

}
