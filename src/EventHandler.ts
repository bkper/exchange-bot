abstract class EventHandler {

  protected abstract processObject(baseBook: Bkper.Book, connectedBook: Bkper.Book, event: bkper.Event): string;

  handleEvent(event: bkper.Event): string[] | string | boolean {
    let bookId = event.bookId;
    let baseBook = BkperApp.getBook(bookId);
    let baseCode = BotService.getBaseCode(baseBook);

    if (baseCode == null || baseCode == '') {
      return 'Please set the "exc_code" property of this book.'
    }

    let responses: string[] = [];
    let connectedBooks = BotService.getConnectedBooks(baseBook);
    
    connectedBooks.forEach(connectedBook => {
      let connectedCode = BotService.getBaseCode(connectedBook);
      if (connectedCode != null && connectedCode != '') {
        let response = this.processObject(baseBook, connectedBook, event);
        if (response) {
          responses.push(response);
        }
      }

    })

    if (responses.length == 0) {
      return false;
    }

    return responses;
  }

  protected extractAmountDescription_(book: Bkper.Book, base: string, connectedCode: string, transaction: bkper.Transaction): AmountDescription {

    let ratesEndpointConfig = BotService.getRatesEndpointConfig(book, transaction.date, 'bot');
    ExchangeApp.setRatesEndpoint(ratesEndpointConfig.url, ratesEndpointConfig.cache);

    return BotService.extractAmountDescription_(book, base, connectedCode, transaction)
  }

  protected buildBookAnchor(book: Bkper.Book) {
    return `<a href='https://app.bkper.com/b/#transactions:bookId=${book.getId()}'>${book.getName()}</a>`;
  }

}