import { Amount, Book, Transaction } from "bkper";
import { extractAmountDescription_, getBaseCode, getRatesEndpointConfig, hasBaseBookInCollection, isBaseBook, match } from "./BotService";
import { EventHandler } from "./EventHandler";

export interface AmountDescription {
  amount: Amount;
  description: string;
  excBaseCode: string;
  excBaseRate: Amount;
}

export abstract class EventHandlerTransaction extends EventHandler {

  async processObject(baseBook: Book, connectedBook: Book, event: bkper.Event): Promise<string> {

    let operation = event.data.object as bkper.TransactionOperation;
    let transaction = operation.transaction;

    if (transaction.agentId == 'exchange-bot') {
      console.log("Same payload agent. Preventing bot loop.");
      return null;
    } 

    if (!transaction.posted) {
      return null;
    }

    let connectedCode = getBaseCode(connectedBook);

    
    
    let ret: Promise<string> = null;
    
    if (event.type == 'TRANSACTION_UPDATED'|| isBaseBook(connectedBook) || !hasBaseBookInCollection(baseBook) || await match(baseBook, connectedCode, transaction)) {
      if (connectedCode != null && connectedCode != '') {
        let iterator = connectedBook.getTransactions(this.getTransactionQuery(transaction));
        if (await iterator.hasNext()) {
          let connectedTransaction = await iterator.next();
          ret = this.connectedTransactionFound(baseBook, connectedBook, transaction, connectedTransaction);
        } else {
          ret = this.connectedTransactionNotFound(baseBook, connectedBook, transaction)
        }
      }
    }

    return ret;
  }


  protected async extractAmountDescription_(baseBook: Book, connectedBook: Book, baseCode: string, connectedCode: string, transaction: bkper.Transaction): Promise<AmountDescription> {

    let ratesEndpointConfig = getRatesEndpointConfig(connectedBook, transaction.date, 'bot');

    return await extractAmountDescription_(baseBook, connectedBook, baseCode, connectedCode, transaction, ratesEndpointConfig.url, ratesEndpointConfig.cache)
  }

  protected abstract getTransactionQuery(transaction: bkper.Transaction): string;

  protected abstract connectedTransactionNotFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction): Promise<string>;

  protected abstract connectedTransactionFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction, connectedTransaction: Transaction): Promise<string>;
}