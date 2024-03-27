import { Account, Book, Transaction } from "bkper";
import { extractAmountDescription_, getBaseCode, getRatesEndpointConfigForDate } from "./BotService";
import { EXC_CODE_PROP, EXC_RATE_PROP, EXC_LOG_PROP, EXC_AMOUNT_PROP, EXC_RATE_HIST_PROP, EXC_DATE_HIST_PROP } from "./constants";
import { AmountDescription, EventHandlerTransaction } from "./EventHandlerTransaction";
import { EventHandlerTransactionEvent } from './EventHandlerTransactionEvent';

export class EventHandlerTransactionUpdated extends EventHandlerTransactionEvent {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected async connectedTransactionNotFound(baseBook: Book, connectedBook: Book, baseTransaction: bkper.Transaction): Promise<string> {

    const timeTagWrite = `Posted not found. [Book ${connectedBook.getName()}] [Owner ${connectedBook.getOwnerName()}] ${Math.random()}`;
    console.time(timeTagWrite);

    let newTransaction = await super.mirrorTransaction(baseBook, connectedBook, baseTransaction);
    console.timeEnd(timeTagWrite);

    return newTransaction ? `${super.buildBookAnchor(connectedBook)}: ${newTransaction.getDate()} ${newTransaction.getAmount()} ${newTransaction.getDescription()}` : null;
  }

  protected async connectedTransactionFound(baseBook: Book, connectedBook: Book, baseTransaction: bkper.Transaction, connectedTransaction: Transaction): Promise<string> {

    const timeTag = `Updated found ${Math.random()}`
    console.time(timeTag)

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

    let amountDescription = await super.extractAmountDescription_(baseBook, connectedBook, baseCode, connectedCode, baseTransaction);

    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount())

    if (amountDescription.amount.eq(0)) {
      if (connectedTransaction.isChecked()) {
        await connectedTransaction.uncheck();
      }
      await connectedTransaction.remove();
      console.timeEnd(timeTag)
      let record = `DELETED: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${await connectedTransaction.getCreditAccountName()} ${await connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;
      return record
    }

    let amountDescriptionHist: AmountDescription | undefined = undefined;

    // exc_date_hist prop: if present, fetch and record historical exchange rate for reference
    const excDateHistProp = baseTransaction.properties[EXC_DATE_HIST_PROP];
    if (excDateHistProp) {
      // historical rates endpoint
      const histRatesEndpointConfig = getRatesEndpointConfigForDate(baseBook, excDateHistProp);
      // historical amount description
      amountDescriptionHist = await extractAmountDescription_(baseBook, connectedBook, baseCode, connectedCode, baseTransaction, histRatesEndpointConfig.url);
    }

    let bookAnchor = super.buildBookAnchor(connectedBook);

    await this.updateConnectedTransaction(baseBook, connectedBook, connectedTransaction, amountDescription, baseTransaction, connectedCreditAccount, connectedDebitAccount, amountDescriptionHist);

    let record = `EDITED: ${connectedTransaction.getDateFormatted()} ${connectedBook.formatValue(connectedTransaction.getAmount())}  ${await connectedTransaction.getCreditAccountName()} ${await connectedTransaction.getDebitAccountName()} ${connectedTransaction.getDescription()}`;

    console.timeEnd(timeTag)

    return `${bookAnchor}: ${record}`;
  }



  private async updateConnectedTransaction(baseBook: Book, connectedBook: Book, connectedTransaction: Transaction, amountDescription: AmountDescription, transaction: bkper.Transaction, connectedCreditAccount: Account, connectedDebitAccount: Account, amountDescriptionHist?: AmountDescription) {

    if (connectedTransaction.isChecked()) {
      await connectedTransaction.uncheck();
    }

    connectedTransaction.setAmount(amountDescription.amount)
      .setDescription(amountDescription.description)
      .setDate(transaction.date)
      .setProperties(transaction.properties)
      .setCreditAccount(connectedCreditAccount)
      .setDebitAccount(connectedDebitAccount)
      .setChecked(transaction.checked)
    ;

    if (amountDescription.excBaseCode) {
      // Exchange code prop
      connectedTransaction.setProperty(EXC_CODE_PROP, amountDescription.excBaseCode);
    }

    if (amountDescription.excBaseRate) {
      // Exchange rate prop
      connectedTransaction.setProperty(EXC_RATE_PROP, amountDescription.excBaseRate.toString())
      // Exchange amount prop
      if (transaction.amount) {
        connectedTransaction.setProperty(EXC_AMOUNT_PROP, transaction.amount);
      }
    }

    if (amountDescription.rates) {
      const excLogEntries = await this.buildExcLog(baseBook, connectedBook, transaction, amountDescription);
      if (excLogEntries.length > 0) {
        connectedTransaction.setProperty(EXC_LOG_PROP, JSON.stringify(excLogEntries));
      }
    }

    // Historical exchange rate prop
    if (amountDescriptionHist && amountDescriptionHist.excBaseRate) {
      // set property
      connectedTransaction.setProperty(EXC_RATE_HIST_PROP, amountDescriptionHist.excBaseRate.toString());
    }

    let urls = transaction.urls;
    if (!urls) {
      urls = [];
    }
    if (transaction.urls) {
      urls = transaction.urls;
    }
    if (transaction.files) {
      transaction.files.forEach(file => {
        urls.push(file.url);
      });
    }

    connectedTransaction.setUrls(urls);

    await connectedTransaction.update();
  }

}
