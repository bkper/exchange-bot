

namespace GainLossUpdateService_ {

  export function getGainLossViewTemplate(bookId: string): GoogleAppsScript.HTML.HtmlOutput {
    let book = BkperApp.getBook(bookId);
    const template = HtmlService.createTemplateFromFile('GainLossUpdateView');
    let today = Utilities.formatDate(new Date(), book.getTimeZone(), 'yyyy-MM-dd');
  
    template.book = {
      id: bookId,
      name: book.getName(),
    }
    template.today = today

    return template.evaluate().setTitle('Exchange Bot');
  }

  export function loadRates(bookId: string, date: string): Bkper.ExchangeRates {
    let book = BkperApp.getBook(bookId);
    let ratesEndpointConfig = Service_.getRatesEndpointConfig(book, date, 'app');
    let ratesJSON = UrlFetchApp.fetch(ratesEndpointConfig.url).getContentText();
    let exchangeRates = JSON.parse(ratesJSON) as Bkper.ExchangeRates;

    let codes: string[] = [];
    Service_.getConnectedBooks(book).add(book).forEach(book => codes.push(Service_.getBaseCode(book)));

    for (const rate in exchangeRates.rates) {
      if (!codes.includes(rate)) {
        delete exchangeRates.rates[rate];
      }
    }

    return exchangeRates;
  }

  export function updateGainLoss(bookId: any, dateParam: string, exchangeRates: Bkper.ExchangeRates): void {
    let book = BkperApp.getBook(bookId);
    let connectedBooks = Service_.getConnectedBooks(book);
    let booksToAudit: Bkper.Book[] = []
    connectedBooks.add(book);
    connectedBooks.forEach(connectedBook => {
      updateGainLossForBook(connectedBook, dateParam, exchangeRates);
      booksToAudit.push(connectedBook);
    });

    booksToAudit.forEach(book => book.audit());

  }

  function updateGainLossForBook(book: Bkper.Book, dateParam: string, exchangeRates: Bkper.ExchangeRates) {

    let connectedBooks = Service_.getConnectedBooks(book);
    let baseCode = Service_.getBaseCode(book);

    var dateSplit = dateParam != null ? dateParam.split('-') : null;

    let year = new Number(dateSplit[0]).valueOf();
    let month = new Number(dateSplit[1]).valueOf() - 1;
    let day = new Number(dateSplit[2]).valueOf();
    var date = new Date(year, month, day, 13, 0, 0, 0);

    //Adjust time zone offset
    date.setTime(date.getTime() + book.getTimeZoneOffset() * 60 * 1000);


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
              let expectedBalance = ExchangeApp.exchange(connectedAccountBalanceOnDate).withRates(exchangeRates).from(connectedCode).to(baseCode).convert();
              let accountBalanceOnDate = getAccountBalance(book, account, date);
              let delta = accountBalanceOnDate - expectedBalance;

              let excAccountName = getExcAccountName(connectedAccount, connectedCode);

              //Verify Exchange account created
              let excAccount = book.getAccount(excAccountName);
              if (excAccount == null) {
                excAccount = book.newAccount().setName(excAccountName).create();
              }
              if (account.isCredit()) {
                delta = delta * -1;
              }

              delta = book.round(delta);

              let transaction = book.newTransaction()
                .setDate(dateParam)
                .setAmount(Math.abs(delta));

              if (delta > 0) {
                transaction.from(account).to(excAccount).setDescription('#exchange_loss').post();
              } else if (delta < 0) {
                transaction.from(excAccount).to(account).setDescription('#exchange_gain').post();
              }
            }
          });
        }
      }
    });

  }

  function getExcAccountName(connectedAccount: Bkper.Account, connectedCode: string): string {
    let groups = connectedAccount.getGroups(); 
    if (groups) {
      for (const group of groups) {
        let excAccount = group.getProperty('exc_account')
        if (excAccount) {
          return excAccount;
        }
      }
    }
    return `Exchange_${connectedCode}`;
  }

  function getAccountBalance(book: Bkper.Book, account: Bkper.Account, date: Date): number {
    let balances = book.getBalancesReport(`account:"${account.getName()}" on:${book.formatDate(date)}`);
    let containers = balances.getBalancesContainers();
    if (containers == null || containers.length == 0) {
      return 0;
    }
    return containers[0].getCumulativeBalance();
  }

}
