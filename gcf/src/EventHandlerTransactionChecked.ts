import { Account, Book, Transaction } from "bkper";
import { getBaseCode } from "./BotService";
import { EventHandlerTransaction } from "./EventHandlerTransaction";

export class EventHandlerTransactionChecked extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected async connectedTransactionFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction, connectedTransaction: Transaction): Promise<string> {
    let bookAnchor = super.buildBookAnchor(connectedBook);
    if (connectedTransaction.isPosted() && !connectedTransaction.isChecked()) {
      await connectedTransaction.check();
      let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())
      let record = `CHECKED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;
      return `${bookAnchor}: ${record}`;
    } else if (!connectedTransaction.isPosted() && this.isReadyToPost(connectedTransaction)) {
      await connectedTransaction.post();
      await connectedTransaction.check();
      let record = `${connectedTransaction.getDate()} ${connectedTransaction.getAmount()} ${connectedTransaction.getCreditAccountName()} ${connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;
      return `${bookAnchor}: ${record}`;
    } else {
      return `${bookAnchor}: DRAFT FOUND`;
    }
  }

  protected async connectedTransactionNotFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction): Promise<string> {
    let baseCreditAccount = await baseBook.getAccount(transaction.creditAccount.id);
    let baseDebitAccount = await baseBook.getAccount(transaction.debitAccount.id);
    let baseCode = getBaseCode(baseBook);
    let connectedCode = getBaseCode(connectedBook);
    let connectedBookAnchor = super.buildBookAnchor(connectedBook);

    let connectedCreditAccount = await connectedBook.getAccount(baseCreditAccount.getName());
    if (connectedCreditAccount == null) {
      try {
        connectedCreditAccount = await this.createAccount(connectedBook, baseCreditAccount);
      } catch (err) {
        //OK
      }
    }
    let connectedDebitAccount = await connectedBook.getAccount(baseDebitAccount.getName());
    if (connectedDebitAccount == null) {
      try {
        connectedDebitAccount = await this.createAccount(connectedBook, baseDebitAccount);
      } catch (err) {
        //OK
      }
    }
    let amountDescription = await super.extractAmountDescription_(connectedBook, baseCode, connectedCode, transaction);

    if (amountDescription.amount == null || amountDescription.amount == 0 || isNaN(amountDescription.amount) || !isFinite(amountDescription.amount)) {
      throw `Exchange rate NOT found for code  ${connectedCode} on ${transaction.date}`;
    }

    let newTransaction = connectedBook.newTransaction()
      .setDate(transaction.date)
      .setProperties(transaction.properties)
      .setAmount(amountDescription.amount)
      .setCreditAccount(await connectedBook.getAccount(baseCreditAccount.getName()))
      .setDebitAccount(await connectedBook.getAccount(baseDebitAccount.getName()))
      .setDescription(amountDescription.description)
      .addRemoteId(transaction.id);

      if (amountDescription.taxAmount) {
        newTransaction.setProperty('tax_amount', connectedBook.formatValue(amountDescription.taxAmount))
      }

      let record = `${newTransaction.getDate()} ${newTransaction.getAmount()} ${baseCreditAccount.getName()} ${baseDebitAccount.getName()} ${amountDescription.description}`;

    if (this.isReadyToPost(newTransaction)) {
      await newTransaction.post();
      await newTransaction.check();
    } else {
      newTransaction.setDescription(`${newTransaction.getCreditAccount() == null ? baseCreditAccount.getName() : ''} ${newTransaction.getDebitAccount() == null ? baseDebitAccount.getName() : ''} ${newTransaction.getDescription()}`.trim())
      await newTransaction.create();
    }

    return `${connectedBookAnchor}: ${record}`;
  }


  private isReadyToPost(newTransaction: Transaction) {
    return newTransaction.getCreditAccount() != null && newTransaction.getDebitAccount() != null && newTransaction.getAmount() != null;
  }

  private async createAccount(connectedBook: Book, baseAccount: Account): Promise<Account> {
    let newConnectedAccount = connectedBook.newAccount()
      .setName(baseAccount.getName())
      .setType(baseAccount.getType())
      .setProperties(baseAccount.getProperties());
    const baseGroups = await baseAccount.getGroups();
    if (baseGroups) {
      for (const baseGroup of baseGroups) {
        let connectedGroup = await connectedBook.getGroup(baseGroup.getName());
        if (connectedGroup == null) {
          connectedGroup = await connectedBook.newGroup().setName(baseGroup.getName()).setProperties(baseGroup.getProperties()).create();
        }
        await newConnectedAccount.addGroup(connectedGroup);        
      }
    }
    await newConnectedAccount.create();
    return newConnectedAccount;
  }
}