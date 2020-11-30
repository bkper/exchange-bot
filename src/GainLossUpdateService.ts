

namespace GainLossUpdateService {

  export function updateGainLoss(bookId: any, dateParam: string, exchangeRates: Bkper.ExchangeRates): string {
    let book = BkperApp.getBook(bookId);
    let response = updateGainLossForBook(book, dateParam, exchangeRates);
    return response;
  }

  function updateGainLossForBook(book: Bkper.Book, dateParam: string, exchangeRates: Bkper.ExchangeRates): string {

    let connectedBooks = BotService.getConnectedBooks(book);
    let baseCode = BotService.getBaseCode(book);

    var date = BotService.parseDateParam(dateParam, book);

    connectedBooks.forEach(connectedBook => {
      let connectedCode = BotService.getBaseCode(connectedBook);
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

    return baseCode;
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


