import { Bkper, Book } from "bkper";
import { getBaseCode, getConnectedBooks, getRatesEndpointConfig, isBaseBook } from "./BotService";
import {  EXC_AUTO_CHECK_PROP, EXC_CODE_PROP } from "./constants";
import { getRates } from "./exchange-service";

export abstract class EventHandler {

  protected abstract processObject(baseBook: Book, connectedBook: Book, event: bkper.Event): Promise<string>;

  async handleEvent(event: bkper.Event): Promise<string[] | string | boolean> {
    let bookId = event.bookId;
    let baseBook = await Bkper.getBook(bookId);
    let baseCode = getBaseCode(baseBook);

    if (baseCode == null || baseCode == '') {
      return `Please set the "${EXC_CODE_PROP}" property of this book.`
    }

    const logtag = `Handling ${event.type} event on book ${baseBook.getName()} from user ${event.user.username} ${Math.random()}`;

    console.time(logtag)

    if (event.type == 'TRANSACTION_POSTED' && baseBook.getProperty(EXC_AUTO_CHECK_PROP)) {
      return false;
    }

    if (event.type == 'TRANSACTION_CHECKED' || event.type == 'TRANSACTION_POSTED' || event.type == 'TRANSACTION_UPDATED') {
      //Load and cache rates prior to pararllel run
      let operation = event.data.object as bkper.TransactionOperation;
      let transaction = operation.transaction;

      let ratesEndpointConfig = getRatesEndpointConfig(baseBook, transaction.date, 'bot');
      await getRates(ratesEndpointConfig.url, ratesEndpointConfig.cache)
    }

    let responsesPromises: Promise<string>[] = [];
    let connectedBooks = await getConnectedBooks(baseBook);

    for (const connectedBook of connectedBooks) {
      let connectedCode = getBaseCode(connectedBook);
      if (connectedCode != null && connectedCode != '') {
        let response = this.processObject(baseBook, connectedBook, event);
        if (response) {
          responsesPromises.push(response);
        }
      }      
    }

    if (responsesPromises.length == 0) {
      console.timeEnd(logtag)
      return false;
    }

    let result = await Promise.all(responsesPromises);
    result = result.filter(r => r != null && r.trim() != '');

    if (event.type == 'TRANSACTION_POSTED') {
      let operation = event.data.object as bkper.TransactionOperation;
      let transaction = operation.transaction;
      // const autoCheck = baseBook.getProperty(EXC_AUTO_CHECK_PROP);
      // if (autoCheck) {
      //   let baseTransaction = await baseBook.getTransaction(transaction.id);
      //   if (!baseTransaction.isChecked() && !baseTransaction.isTrashed()) {
      //     //
      //     if (isBaseBook(baseBook) || result.length > 0) {
      //       await baseTransaction.check();
      //     }
      //   }
      // }
    }

    console.timeEnd(logtag)

    if (result.length == 0) {
      return false;
    }

    return result;
  }


  protected buildBookAnchor(book: Book) {
    return `<a href='https://app.bkper.com/b/#transactions:bookId=${book.getId()}'>${book.getName()}</a>`;
  }

}