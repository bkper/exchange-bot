import { Amount, Book, Transaction } from "bkper";
import { extractAmountDescription_, getBaseCode, getRatesEndpointConfig } from "./BotService";
import { EventHandler } from "./EventHandler";

export interface AmountDescription {
  amount: Amount;
  description: string;
  taxAmount: Amount;
}

export abstract class EventHandlerTransaction extends EventHandler {

  async processObject(baseBook: Book, connectedBook: Book, event: bkper.Event): Promise<string> {

    let operation = event.data.object as bkper.TransactionOperation;
    let transaction = operation.transaction;

    if (transaction.agentId == 'exchange-bot') {
      console.log("Same payload agent. Preventing bot loop.");
      return null;
    } 

    if (transaction.agentId == 'sales-tax-bot') {
      console.log("Skiping Tax Bot agent.");
      return null;
    } 

    if (!transaction.posted) {
      return null;
    }

    let connectedCode = getBaseCode(connectedBook);
    if (connectedCode != null && connectedCode != '') {
      let iterator = connectedBook.getTransactions(this.getTransactionQuery(transaction));
      if (await iterator.hasNext()) {
        let connectedTransaction = await iterator.next();
        return this.connectedTransactionFound(baseBook, connectedBook, transaction, connectedTransaction);
      } else {
        return this.connectedTransactionNotFound(baseBook, connectedBook, transaction)
      }
    }
    return null;
  }

  protected async extractAmountDescription_(book: Book, base: string, connectedCode: string, transaction: bkper.Transaction): Promise<AmountDescription> {

    let ratesEndpointConfig = getRatesEndpointConfig(book, transaction.date, 'bot');

    return await extractAmountDescription_(book, base, connectedCode, transaction, ratesEndpointConfig.url, ratesEndpointConfig.cache)
  }

  protected abstract getTransactionQuery(transaction: bkper.Transaction): string;

  protected abstract connectedTransactionNotFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction): Promise<string>;

  protected abstract connectedTransactionFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction, connectedTransaction: Transaction): Promise<string>;
}