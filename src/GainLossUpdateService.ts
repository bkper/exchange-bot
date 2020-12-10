

namespace GainLossUpdateService {

  export function updateGainLoss(bookId: any, dateParam: string, exchangeRates: Bkper.ExchangeRates): string {
    let book = BkperApp.getBook(bookId);
    let response = updateGainLossForBook(book, dateParam, exchangeRates);
    return response;
  }

  function updateGainLossForBook(book: Bkper.Book, dateParam: string, exchangeRates: Bkper.ExchangeRates): string {

    let connectedBooks = BotService.getConnectedBooks(book);
    let baseCode = BotService.getBaseCode(book);

    var date = BotService.parseDateParam(dateParam);

    connectedBooks.forEach(connectedBook => {
      let connectedCode = BotService.getBaseCode(connectedBook);
      let accounts = getMatchingAccounts(book, connectedCode);
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
    });

    return baseCode;
  }

  function getMatchingAccounts(book: Bkper.Book, code: string): Set<Bkper.Account> {
    let accounts = new Set<Bkper.Account>();
    let group = book.getGroup(code);
    if (group != null) {
      let groupAccounts = group.getAccounts();
      if (groupAccounts != null) {
        groupAccounts.forEach(account => {
          accounts.add(account);
        })
      }
    }
    let groups = book.getGroups();
    if (groups != null) {
        groups.forEach(group => {
          if (group.getProperty('exc_code') == code) {
            let groupAccounts = group.getAccounts();
            if (groupAccounts != null) {
              groupAccounts.forEach(account => {
                accounts.add(account);
              })
            }
          }
        }
      )
    }

    return accounts;
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
    let balances;
    if (account.isPermanent()) {
      balances = book.getBalancesReport(`account:"${account.getName()}" on:${book.formatDate(date, Session.getScriptTimeZone())}`);
    } else {
      var dateAfter = new Date(date.getTime());
      dateAfter.setDate(dateAfter.getDate() + 1)
      balances = book.getBalancesReport(`account:"${account.getName()}" before:${book.formatDate(dateAfter, Session.getScriptTimeZone())}`);
    }
    let containers = balances.getBalancesContainers();
    if (containers == null || containers.length == 0) {
      return 0;
    }
    return containers[0].getCumulativeBalance();
  }

}


