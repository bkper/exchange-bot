import { Account, Book, Transaction } from "bkper";
import { getBaseCode } from "./BotService";
import { AmountDescription, EventHandlerTransaction } from "./EventHandlerTransaction";

export class EventHandlerTransactionUpdated extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected connectedTransactionNotFound(baseBook: Book, connectedBook: Book, baseTransaction: bkper.Transaction): Promise<string> {
    return null;
  }
  protected async connectedTransactionFound(baseBook: Book, connectedBook: Book, baseTransaction: bkper.Transaction, connectedTransaction: Transaction): Promise<string> {
    let baseCreditAccount = await baseBook.getAccount(baseTransaction.creditAccount.id);
    let baseDebitAccount = await baseBook.getAccount(baseTransaction.debitAccount.id);
    let baseCode = getBaseCode(baseBook);
    let connectedCode = getBaseCode(connectedBook);

    let connectedCreditAccount = await connectedBook.getAccount(baseCreditAccount.getName());
    if (connectedCreditAccount == null) {
      try {
        connectedCreditAccount = await connectedBook.newAccount().setName(baseCreditAccount.getName()).create();
      } catch (err) {
        //OK
      }
    }
    let connectedDebitAccount = await connectedBook.getAccount(baseDebitAccount.getName());
    if (connectedDebitAccount == null) {
      try {
        connectedDebitAccount = await connectedBook.newAccount().setName(baseDebitAccount.getName()).create();
      } catch (err) {
        //OK
      }
    }


    let amountDescription = await super.extractAmountDescription_(connectedBook, baseCode, connectedCode, baseTransaction);

    let bookAnchor = super.buildBookAnchor(connectedBook);

    await this.updateConnectedTransaction(connectedBook, connectedTransaction, amountDescription, baseTransaction, connectedCreditAccount, connectedDebitAccount);

    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())

    let record = `EDITED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;

    return `${bookAnchor}: ${record}`;
  }



private async updateConnectedTransaction(connectedBook: Book, connectedTransaction: Transaction, amountDescription: AmountDescription, transaction: bkper.Transaction, connectedCreditAccount: Account, connectedDebitAccount: Account) {
  if (connectedTransaction.isChecked()) {
    await connectedTransaction.uncheck();
  }

  connectedTransaction.setAmount(amountDescription.amount)
    .setDescription(amountDescription.description)
    .setDate(transaction.date)
    .setProperties(transaction.properties)
    .setCreditAccount(connectedCreditAccount)
    .setDebitAccount(connectedDebitAccount);

    if (amountDescription.taxAmount) {
      connectedTransaction.setProperty('tax_amount', connectedBook.formatValue(amountDescription.taxAmount))
    }

  let urls = transaction.urls;
  if (!urls) {
    urls = [];
  }

  if (connectedTransaction.getUrls()) {
    urls = urls.concat(connectedTransaction.getUrls());
  }

  if (transaction.files) {
    transaction.files.forEach(file => {
      urls.push(file.url);
    });
  }

  connectedTransaction
    .setUrls(urls);

  await connectedTransaction.update();
}



}

