import { Bkper, Book } from "bkper";
import { getBaseCode, getConnectedBooks, getRatesEndpointConfig } from "./BotService";
import { getRates } from "./exchange-service";

export abstract class EventHandler {

  protected abstract processObject(baseBook: Book, connectedBook: Book, event: bkper.Event): Promise<string>;

  async handleEvent(event: bkper.Event): Promise<string[] | string | boolean> {
    let bookId = event.bookId;
    let baseBook = await Bkper.getBook(bookId);
    let baseCode = getBaseCode(baseBook);

    if (baseCode == null || baseCode == '') {
      return 'Please set the "exc_code" property of this book.'
    }


    if (event.type == 'TRANSACTION_CHECKED' || event.type == 'TRANSACTION_UPDATED') {
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
      return false;
    }

    return Promise.all(responsesPromises);
  }


  protected buildBookAnchor(book: Book) {
    return `<a href='https://app.bkper.com/b/#transactions:bookId=${book.getId()}'>${book.getName()}</a>`;
  }

}