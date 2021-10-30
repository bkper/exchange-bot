import { Account, AccountType, Book, Transaction } from "bkper";
import { getBaseCode } from "./BotService";
import { EXC_AMOUNT_PROP, EXC_CODE_PROP, EXC_RATE_PROP } from "./constants";
import { EventHandlerTransaction } from "./EventHandlerTransaction";

export class EventHandlerTransactionPostedOrChecked extends EventHandlerTransaction {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected async connectedTransactionFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction, connectedTransaction: Transaction): Promise<string> {

    const timeTag = `PostedOrChecked found ${Math.random()}`
    console.time(timeTag)

    if (connectedTransaction.isPosted() && !connectedTransaction.isChecked()) {
      await connectedTransaction.check();
      const resp = this.buildCheckResponse(connectedBook, connectedTransaction);
      console.timeEnd(timeTag)

      return resp;
    } else if (!connectedTransaction.isPosted() && this.isReadyToPost(connectedTransaction.json())) {
      await connectedTransaction.post();
      await connectedTransaction.check();
      const resp = this.buildCheckResponse(connectedBook, connectedTransaction);
      console.timeEnd(timeTag)

      return resp;
    } else {
      const resp = this.buildCheckResponse(connectedBook, connectedTransaction);
      console.timeEnd(timeTag)

      return resp;
    }

  }

  private buildCheckResponse(connectedBook: Book, connectedTransaction: Transaction) {
    let bookAnchor = super.buildBookAnchor(connectedBook);
    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount());
    let record = `CHECKED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getDescription()}`;
    return `${bookAnchor}: ${record}`;
  }

  protected async connectedTransactionNotFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction): Promise<string> {

    const timeTagRead = `PostedOrChecked not found read [Book: ${baseBook.getName()}] [Owner ${connectedBook.getOwnerName()}] ${Math.random()}`
    console.time(timeTagRead)


    let baseCode = getBaseCode(baseBook);
    let baseCreditAccount = transaction.creditAccount;
    let baseDebitAccount = transaction.debitAccount;
    let connectedCode = getBaseCode(connectedBook);
    let connectedBookAnchor = super.buildBookAnchor(connectedBook);

    let connectedCreditDebitAccounts = await Promise.all([connectedBook.getAccount(baseCreditAccount.name), connectedBook.getAccount(baseDebitAccount.name)])

    let connectedCreditAccount = connectedCreditDebitAccounts[0] ;
    if (connectedCreditAccount == null) {
      try {
        connectedCreditAccount = await this.createAccount(connectedBook, baseCreditAccount);
      } catch (err) {
        //OK
      }
    }
    let connectedDebitAccount = connectedCreditDebitAccounts[1] ;
    if (connectedDebitAccount == null) {
      try {
        connectedDebitAccount = await this.createAccount(connectedBook, baseDebitAccount);
      } catch (err) {
        //OK
      }
    }


    let amountDescription = await super.extractAmountDescription_(baseBook, connectedBook, baseCode, connectedCode, transaction);

    if (amountDescription.amount == null) {
      throw `Exchange rate NOT found for code  ${connectedCode} on ${transaction.date}`;
    }


    if (amountDescription.amount.eq(0)) {
      return null;
    }


    const creditDebitAccounts = await Promise.all([connectedBook.getAccount(baseCreditAccount.name), connectedBook.getAccount(baseDebitAccount.name)])

    console.timeEnd(timeTagRead)



    const timeTagWrite = `PostedOrChecked not found write. [Book ${connectedBook.getName()}] [Owner ${connectedBook.getOwnerName()}] ${Math.random()}`
    console.time(timeTagWrite)

    let newTransaction = connectedBook.newTransaction()
      .setDate(transaction.date)
      .setProperties(transaction.properties)
      .setAmount(amountDescription.amount)
      .setCreditAccount(creditDebitAccounts[0])
      .setDebitAccount(creditDebitAccounts[1])
      .setDescription(amountDescription.description)
      .addRemoteId(transaction.id);


      if (amountDescription.excBaseCode) {
        newTransaction.setProperty(EXC_CODE_PROP, amountDescription.excBaseCode);
      }

      if (amountDescription.excBaseRate) {
        newTransaction.setProperty(EXC_RATE_PROP, amountDescription.excBaseRate.toString())
      }

      let record = `${newTransaction.getDate()} ${newTransaction.getAmount()} ${baseCreditAccount.name} ${baseDebitAccount.name} ${amountDescription.description}`;

    if (this.isReadyToPost(newTransaction.json())) {
      await newTransaction.post();
      if (transaction.checked) {
        await newTransaction.check();
      }
    } else {
      newTransaction.setDescription(`${newTransaction.getCreditAccount() == null ? baseCreditAccount.name : ''} ${newTransaction.getDebitAccount() == null ? baseDebitAccount.name : ''} ${newTransaction.getDescription()}`.trim())
      await newTransaction.create();
    }

    console.timeEnd(timeTagWrite)

    return `${connectedBookAnchor}: ${record}`;
  }


  private isReadyToPost(newTransaction: bkper.Transaction) {
    return newTransaction.creditAccount != null && newTransaction.debitAccount != null && newTransaction.amount != null;
  }

  private async createAccount(connectedBook: Book, baseAccount: bkper.Account): Promise<Account> {
    let newConnectedAccount = connectedBook.newAccount()
      .setName(baseAccount.name)
      .setType(baseAccount.type as AccountType)
      .setProperties(baseAccount.properties);
    const baseGroups = baseAccount.groups;
    if (baseGroups) {
      for (const baseGroup of baseGroups) {
        let connectedGroup = await connectedBook.getGroup(baseGroup.name);
        if (connectedGroup == null) {
          connectedGroup = await connectedBook.newGroup().setName(baseGroup.name).setProperties(baseGroup.properties).create();
        }
        await newConnectedAccount.addGroup(connectedGroup);        
      }
    }
    await newConnectedAccount.create();
    return newConnectedAccount;
  }
}