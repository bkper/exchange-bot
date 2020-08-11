namespace TransactionUncheckedHandler_ {

  interface AmountDescription {
    amount: string;
    description: string;
  }
  export function handleTransactionUnchecked(event: bkper.Event) {
    return "transaction unchecked"
    // let bookId = event.bookId;
    // let book = BkperApp.getBook(bookId);

    // let operation = event.data.object as bkper.TransactionOperation;

    // let transaction = operation.transaction;

    // let connectedBooks = Service_.getConnectedBooks(book);
    // connectedBooks.forEach(connectedBook => {
    // })
  }

}