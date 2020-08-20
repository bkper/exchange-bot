abstract class EventHandler {

  protected abstract processObject(baseBook: Bkper.Book, connectedBook: Bkper.Book, event: bkper.Event): string;

  handleEvent(event: bkper.Event): string[] | string {
    let bookId = event.bookId;
    let baseBook = BkperApp.getBook(bookId);
    let baseCode = Service_.getBaseCode(baseBook);

    if (baseCode == null || baseCode == '') {
      return 'Please set the "exc_code" property of this book.'
    }

    let responses: string[] = [];
    let connectedBooks = Service_.getConnectedBooks(baseBook);
    
    connectedBooks.forEach(connectedBook => {
      let connectedCode = Service_.getBaseCode(connectedBook);
      if (connectedCode != null && connectedCode != '') {
        let response = this.processObject(baseBook, connectedBook, event);
        if (response) {
          responses.push(response);
        }
      }

    })

    return responses;
  }

  protected extractAmountDescription_(book: Bkper.Book, base: string, connectedCode: string, transaction: bkper.Transaction): AmountDescription {
    let parts = transaction.description.split(' ');

    for (const part of parts) {
      if (part.startsWith(connectedCode)) {
        try {
          return {
            amount: +part.replace(connectedCode, ''),
            description: transaction.description.replace(part, `${base}${transaction.amount}`)
          };
        } catch (error) {
          continue;
        }
      }
    }

    Service_.setRatesEndpoint(book, transaction.date, 'bot');

    Logger.log(`TRANSACTION AMOUNT: ${transaction.amount}` )

    let amount = ExchangeApp.exchange(+transaction.amount).from(base).to(connectedCode).convert();

    return {
      amount: amount,
      description: `${transaction.description}`,
    };
  }

  protected buildBookAnchor(book: Bkper.Book) {
    return `<a href='https://app.bkper.com/b/#transactions:bookId=${book.getId()}'>${book.getName()}</a>`;
  }

}