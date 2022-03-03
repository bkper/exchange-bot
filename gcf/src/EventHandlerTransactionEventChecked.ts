import { Account, AccountType, Book, Transaction } from "bkper";
import { getBaseCode } from "./BotService";
import { EXC_AMOUNT_PROP, EXC_CODE_PROP, EXC_RATE_PROP } from "./constants";
import { EventHandlerTransactionEvent } from "./EventHandlerTransactionEvent";

export class EventHandlerTransactionChecked extends EventHandlerTransactionEvent {

  protected getTransactionQuery(transaction: bkper.Transaction): string {
    return `remoteId:${transaction.id}`;
  }

  protected async connectedTransactionFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction, connectedTransaction: Transaction): Promise<string> {

    const timeTag = `Checked found ${Math.random()}`
    console.time(timeTag)

    let baseCode = getBaseCode(baseBook);
    let connectedCode = getBaseCode(connectedBook);

    var currAmout = connectedTransaction.getAmount();

    let amountDescription = await super.extractAmountDescription_(baseBook, connectedBook, baseCode, connectedCode, transaction);
    
    let resp = null;

    var NUM_OF_DECIMAL_PLACES = 3;

    if(!currAmout.round(NUM_OF_DECIMAL_PLACES).eq(amountDescription.amount.round(NUM_OF_DECIMAL_PLACES) )){
      
      connectedTransaction.setAmount(amountDescription.amount)
      connectedTransaction.setProperty(EXC_RATE_PROP, amountDescription.excBaseRate.toString())

      if(connectedTransaction.isChecked()){
        await connectedTransaction.uncheck()
      }
      await (await connectedTransaction.update()).check();

      resp = this.buildCheckResponse("UPDATED AND CHECKED", connectedBook, connectedTransaction);

    } else if (connectedTransaction.isPosted() && !connectedTransaction.isChecked()) {
      await connectedTransaction.check();
      resp = this.buildCheckResponse("CHECKED", connectedBook, connectedTransaction);
      
    } else if (!connectedTransaction.isPosted() && this.isReadyToPost(connectedTransaction.json())) {
      await connectedTransaction.post();
      await connectedTransaction.check();
      resp = this.buildCheckResponse("POSTED AND CHECKED", connectedBook, connectedTransaction);

    } else {
      resp = this.buildCheckResponse("ALREADY CHECKED", connectedBook, connectedTransaction);
    }

    console.timeEnd(timeTag)
    return resp;
    

  }

  private buildCheckResponse(tag: string, connectedBook: Book, connectedTransaction: Transaction) {
    let bookAnchor = super.buildBookAnchor(connectedBook);
    let amountFormatted = connectedBook.formatValue(connectedTransaction.getAmount());
    let record = `${tag}: ${connectedTransaction.getDateFormatted()} ${amountFormatted} ${connectedTransaction.getDescription()}`;
    return `${bookAnchor}: ${record}`;
  }

  protected async connectedTransactionNotFound(baseBook: Book, connectedBook: Book, transaction: bkper.Transaction): Promise<string> {

    const timeTagWrite = `Checked not found. [Book ${connectedBook.getName()}] [Owner ${connectedBook.getOwnerName()}] ${Math.random()}`
    console.time(timeTagWrite)

    let newTransaction = await super.mirrorTransaction(baseBook, connectedBook, transaction);

    if (newTransaction.isPosted()) {
      await newTransaction.check();
    }

    console.timeEnd(timeTagWrite)
    return `${super.buildBookAnchor(connectedBook)}: ${newTransaction.getDate()} ${newTransaction.getAmount()} ${newTransaction.getDescription()}`;
  }

}