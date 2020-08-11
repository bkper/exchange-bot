namespace TransactionCheckedHandler_ {

  interface AmountDescription {
    amount: string;
    description: string;
  }

  export function handleTransactionChecked(event: bkper.Event): string[] | string {

    let bookId = event.bookId;

    let book = BkperApp.getBook(bookId);
    let baseCode = Service_.getBaseCode(book);

    if (baseCode == null || baseCode == '') {
      return 'Please set the "exc_code" property of this book.'
    }

    let operation = event.data.object as bkper.TransactionOperation;
    let transaction = operation.transaction;

    let creditAcc = book.getAccount(transaction.creditAccount.id);
    let debitAcc = book.getAccount(transaction.debitAccount.id);

    let responses: string[] = [];

    let connectedBooks = Service_.getConnectedBooks(book);

    connectedBooks.forEach(connectedBook => {
      let connectedCode = Service_.getBaseCode(connectedBook);
      if (connectedCode != null && connectedCode != '') {
        if (connectedBook.getAccount(creditAcc.getName()) == null) {
          try {
            connectedBook.createAccount(creditAcc.getName());
          } catch (err) {
            //OK
          }
        }
        if (connectedBook.getAccount(debitAcc.getName()) == null) {
          try {
            connectedBook.createAccount(debitAcc.getName());
          } catch (err) {
            //OK
          }
        }
        let bookAnchor = buildBookAnchor_(connectedBook);
        let amountDescription = extractAmountDescription_(connectedBook, baseCode, connectedCode, transaction);
        let record = `${transaction.dateFormatted} ${amountDescription.amount} ${creditAcc.getName()} ${debitAcc.getName()} ${amountDescription.description}`;
        connectedBook.record(`${record} id:${transaction.id}`);
        responses.push(`${bookAnchor}: ${record}`);
      }
    })

    return responses;
  }


  function extractAmountDescription_(book: Bkper.Book, base: string, connectedCode: string, transaction: bkper.Transaction): AmountDescription {
    let parts = transaction.description.split(' ');

    for (const part of parts) {
      if (part.startsWith(connectedCode)) {
        try {
          return {
            amount: part.replace(connectedCode, ''),
            description: transaction.description.replace(part, `${base}${transaction.amount}`)
          };
        } catch (error) {
          continue;
        }
      }
    }

    Service_.setRatesEndpoint(book, transaction.date, 'bot');
    let amount = ExchangeApp.exchange(+transaction.amount).from(base).to(connectedCode).convert();

    return {
      amount: book.formatValue(amount),
      description: `${transaction.description}`,
    };
  }

  function buildBookAnchor_(book: Bkper.Book) {
    return `<a href='https://app.bkper.com/b/#transactions:bookId=${book.getId()}'>${book.getName()}</a>`;
  }
}