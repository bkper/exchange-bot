function doGet(e: GoogleAppsScript.Events.AppsScriptHttpRequestEvent) {
  //@ts-ignore
  let bookId = e.parameter.bookId;
  let book = BkperApp.getBook(bookId);
  const template = HtmlService.createTemplateFromFile('GainLossUpdateView');

  template.book = {
    id: bookId,
    name: book.getName(),
    timeZone: book.getTimeZone()
  }

  return template.evaluate().setTitle('Exchange Bot');;

}

function updateGainLoss(bookId: any, dateParam: string) {
  let book = BkperApp.getBook(bookId);
  let connectedBooks = Service_.getConnectedBooks(book);
  let baseCode = Service_.getBaseCode(book);

  Service_.setRatesEndpoint(book, dateParam, 'app');

  var dateSplit = dateParam != null ? dateParam.split('-') : null;
  
  let year = new Number(dateSplit[0]).valueOf();
  let month = new Number(dateSplit[1]).valueOf() - 1;
  let day = new Number(dateSplit[2]).valueOf();
  var date = new Date(year, month , day, 13, 0, 0, 0);
  
  //Adjust time zone offset
  date.setTime(date.getTime() + book.getTimeZoneOffset()*60*1000 );    

  connectedBooks.forEach(connectedBook => {
    let connectedCode = Service_.getBaseCode(connectedBook);
    let group = book.getGroup(connectedCode);
    if (group != null) {
      let accounts = group.getAccounts();
      if (accounts != null) {
        accounts.forEach(account => {
          let connectedAccount = connectedBook.getAccount(account.getName());
          if (connectedAccount != null) {
            let connectedAccountBalanceOnDate = getAccountBalance(connectedBook, connectedAccount, date);
            let expectedBalance = ExchangeApp.exchange(connectedAccountBalanceOnDate).from(connectedCode).to(baseCode).convert();
            let accountBalanceOnDate = getAccountBalance(book, account, date);
            let delta = accountBalanceOnDate - expectedBalance;
            let excAccountName = `Exchange_${connectedCode}`;
            //Verify Exchange account created
            let excAccount = book.getAccount(excAccountName);
            if (excAccount == null) {
              excAccount = book.createAccount(excAccountName);
            }
            if (account.isCredit()) {
              delta = delta * -1;
            }

            delta = book.round(delta);

            if (delta > 0) {
              book.record(`${account.getName()} ${excAccountName} ${book.formatDate(date)} ${book.formatValue(Math.abs(delta))} #exchange_loss`);
            } else if (delta < 0) {
              book.record(`${excAccountName} ${account.getName()} ${book.formatDate(date)} ${book.formatValue(Math.abs(delta))} #exchange_gain`);
            }
          }
        });
      }
    }
  });
}

function getAccountBalance(book: Bkper.Book, account: Bkper.Account, date: Date): number {
  let balances = book.getBalancesReport(`account:"${account.getName()}" on:${book.formatDate(date)}`);
  let containers = balances.getBalancesContainers();
  if (containers == null || containers.length == 0) {
    return 0;
  }
  return containers[0].getCumulativeBalance();
}

