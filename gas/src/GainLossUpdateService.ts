

namespace GainLossUpdateService {

  export function updateGainLoss(bookId: any, dateParam: string, exchangeRates: ExchangeRates): Summary {
    let book = BkperApp.getBook(bookId);
    let response = updateGainLossForBook(book, dateParam, exchangeRates);
    return response;
  }

  function updateGainLossForBook(book: Bkper.Book, dateParam: string, exchangeRates: ExchangeRates): Summary {

    let connectedBooks = BotService.getConnectedBooks(book);
    let baseCode = BotService.getBaseCode(book);

    let closingDateProp = book.getProperty(REPORT_CLOSING_DATE_PROP);
    let excHistoricalProp = book.getProperty(EXC_HISTORICAL);

    var date = BotService.parseDateParam(dateParam);

    let result: {[key: string]: Bkper.Amount} = {};

    connectedBooks.forEach(connectedBook => {
      let connectedCode = BotService.getBaseCode(connectedBook);
      let accounts = getMatchingAccounts(book, connectedCode);
      accounts.forEach(account => {
        let connectedAccount = connectedBook.getAccount(account.getName());
        if (connectedAccount != null) {
          let connectedAccountBalanceOnDate = getAccountBalance(connectedBook, connectedAccount, date, closingDateProp, excHistoricalProp);
          let expectedBalance = ExchangeService.convert(connectedAccountBalanceOnDate, connectedCode, baseCode, exchangeRates);

          let accountBalanceOnDate = getAccountBalance(book, account, date, closingDateProp, excHistoricalProp);
          let delta = accountBalanceOnDate.minus(expectedBalance.amount);

          let excAccountName = getExcAccountName(connectedAccount, connectedCode);

          //Verify Exchange account created
          let excAccount = book.getAccount(excAccountName);
          if (excAccount == null) {
            excAccount = book.newAccount()
            .setName(excAccountName);
            let groups = getExcAccountGroups(book);
            groups.forEach(group => excAccount.addGroup(group));  
            let type = getExcAccountType(book);          
            excAccount.setType(type);
            excAccount.create();
            result[excAccount.getName()] = BkperApp.newAmount(0);
          }
          if (account.isCredit()) {
            delta = delta.times(-1);
          }

          const deltaRounded = book.round(delta);

          let transaction = book.newTransaction()
            .setDate(dateParam)
            .setProperty(EXC_CODE_PROP, connectedCode)
            .setProperty(EXC_RATE_PROP, expectedBalance.rate.toString())
            .setProperty(EXC_AMOUNT_PROP, "0")
            .setAmount(delta.abs());

          if (deltaRounded.gt(0)) {
            transaction.from(account).to(excAccount).setDescription('#exchange_loss').post();
            if (book.getProperty(EXC_ON_CHECK, 'exc_auto_check')) {
              transaction.check();
            }
            aknowledgeResult(result, excAccount, delta);
          } else if (deltaRounded.lt(0)) {
            transaction.from(excAccount).to(account).setDescription('#exchange_gain').post();
            if (book.getProperty(EXC_ON_CHECK, 'exc_auto_check')) {
              transaction.check();
            }
            aknowledgeResult(result, excAccount, delta);
          }

        }
      });
    });

    let stringResult: {[key: string]: string} = {}
    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        stringResult[key] = book.round(result[key]).toFixed(book.getFractionDigits())
      }
    }

    return {code: baseCode, result: JSON.stringify(stringResult)};
  }

  function aknowledgeResult(result: {[key: string]: Bkper.Amount}, excAccount: Bkper.Account, delta: Bkper.Amount) {
    if (result[excAccount.getName()] == null) {
      result[excAccount.getName()] = BkperApp.newAmount(0);
    }
    result[excAccount.getName()] = result[excAccount.getName()].plus(delta);
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
          if (group.getProperty(EXC_CODE_PROP) == code) {
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
        let excAccount = group.getProperty(EXC_ACCOUNT_PROP)
        if (excAccount) {
          return excAccount;
        }
      }
    }
    return `Exchange_${connectedCode}`;
  }

  export function getExcAccountGroups(book: Bkper.Book): Set<Bkper.Group> {
    let accountNames = new Set<string>();

    book.getAccounts().forEach(account => {
      let accountName = account.getProperty(EXC_ACCOUNT_PROP);
      if (accountName) {
        accountNames.add(accountName);
      }
      if (account.getName().startsWith('Exchange_')) {
        accountNames.add(account.getName());
      }
    });

    let groups = new Set<Bkper.Group>();

    accountNames.forEach(accountName => {
      let account = book.getAccount(accountName);
      if (account && account.getGroups()) {
        account.getGroups().forEach(group => {groups.add(group)})
      }
    })

    return groups;
  }

  export function getExcAccountType(book: Bkper.Book): Bkper.AccountType {
    let accountNames = new Set<string>();

    book.getAccounts().forEach(account => {
      let accountName = account.getProperty(EXC_ACCOUNT_PROP);
      if (accountName) {
        console.log(`Adding: ${accountName}`)
        accountNames.add(accountName);
      }
      if (account.getName().startsWith('Exchange_')) {
        console.log(`Adding: ${account.getName()}`)
        accountNames.add(account.getName());
      }
    });

    for (const accountName of accountNames) {
      let account = book.getAccount(accountName);
      if (account) {
        return account.getType();
      }
    }
    
    return BkperApp.AccountType.LIABILITY;
  }

  function getAccountBalance(book: Bkper.Book, account: Bkper.Account, date: Date, closingDateProp: string, historicalProp: string): Bkper.Amount {
    let query;
    if (account.isPermanent()) {
      query = `account:"${account.getName()}" on:${book.formatDate(date)}`;
    } else {
      var dateAfter = new Date(date.getTime());
      dateAfter.setDate(dateAfter.getDate() + 1)
      if (!historicalProp && closingDateProp) {
        let openingDate: Date;
        try {
          const closingDate = new Date();
          closingDate.setTime(book.parseDate(closingDateProp).getTime());
          closingDate.setDate(closingDate.getDate() + 1);
          openingDate = closingDate;
        } catch (error) {
          throw `Error parsing closing date property: ${closingDateProp}`
        }
        query = `account:"${account.getName()}" after:${book.formatDate(openingDate)} before:${book.formatDate(dateAfter)}`;
      } else {
        query = `account:"${account.getName()}" before:${book.formatDate(dateAfter)}`;
      }
    }
    let containers = book.getBalancesReport(query).getBalancesContainers();
    if (containers == null || containers.length == 0) {
      return BkperApp.newAmount(0);
    }
    return containers[0].getCumulativeBalance();
  }

}


