import { Account, Amount, Bkper, Book, Transaction } from "bkper";
import { extractAmountDescription_, getBaseCode, getRatesEndpointConfig, hasBaseBookInCollection, isBaseBook } from "./BotService";
import { EXC_AUTO_CHECK_PROP, EXC_CODE_PROP } from "./constants";
import { EventHandler } from "./EventHandler";

export interface AmountDescription {
  amount: Amount;
  description: string;
  taxAmount: Amount;
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

    if (transaction.agentId == 'sales-tax-bot') {
      console.log("Skiping Tax Bot agent.");
      return null;
    } 

    if (!transaction.posted) {
      return null;
    }

    let connectedCode = getBaseCode(connectedBook);

    
    
    let ret: Promise<string> = null;
    
    if (event.type == 'TRANSACTION_UPDATED' || !hasBaseBookInCollection(baseBook) || isBaseBook(connectedBook) || await this.match(baseBook, connectedCode, transaction)) {
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

  private async match(baseBook: Book, connectedCode: string, transaction: bkper.Transaction): Promise<boolean> {
    console.time("match");

    let matchingAccounts = await this.getMatchingAccounts(baseBook, connectedCode)
    for (const account of matchingAccounts) {
      if (transaction.creditAccount.id == account.getId() || transaction.debitAccount.id == account.getId()) {
        return true;
      }
    }
    console.timeEnd("match")
    return false;
  }
  private async getMatchingAccounts(book: Book, code: string): Promise<Set<Account>> {
    let accounts = new Set<Account>();
    let group = await book.getGroup(code);
    if (group != null) {
      let groupAccounts = await group.getAccounts();
      if (groupAccounts != null) {
        groupAccounts.forEach(account => {
          accounts.add(account);
        })
      }
    }
    let groups = await book.getGroups();
    if (groups != null) {
      for (const group of groups) {
          if (group.getProperty(EXC_CODE_PROP) == code) {
            let groupAccounts = await group.getAccounts();
            if (groupAccounts != null) {
              groupAccounts.forEach(account => {
                accounts.add(account);
              })
            }
          }
        }
    }

    return accounts;
  }

  protected async extractAmountDescription_(book: Book, base: string, connectedCode: string, transaction: bkper.Transaction): Promise<AmountDescription> {

    let ratesEndpointConfig = getRatesEndpointConfig(book, transaction.date, 'bot');

    return await extractAmountDescription_(book, base, connectedCode, transaction, ratesEndpointConfig.url, ratesEndpointConfig.cache)
  }

  protected abstract getTransactionQuery(transaction: bkper.Transaction): string;

  protected abstract connectedTransactionNotFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction): Promise<string>;

  protected abstract connectedTransactionFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction, connectedTransaction: Transaction): Promise<string>;
}