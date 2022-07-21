

namespace GainLossUpdateService {

  export function updateGainLoss(bookId: any, dateParam: string, exchangeRates: ExchangeRates): Summary {
    let book = BkperApp.getBook(bookId);
    let response = updateGainLossForBook(book, dateParam, exchangeRates);
    return response;
  }

  function updateGainLossForBook(book: Bkper.Book, dateParam: string, exchangeRates: ExchangeRates): Summary {

    let connectedBooks = BotService.getConnectedBooks(book);
    let baseCode = BotService.getBaseCode(book);

    let bookClosingDate = book.getClosingDate();
    let excHistoricalProp = book.getProperty(EXC_HISTORICAL);
    
    let date = BotService.parseDateParam(dateParam);

    let query = getAccountQuery(book, date, bookClosingDate, excHistoricalProp);

    let bookBalancesReport = book.getBalancesReport(query)

    let result: {[key: string]: Bkper.Amount} = {};

    connectedBooks.forEach(connectedBook => {
      let connectedCode = BotService.getBaseCode(connectedBook);
      let accounts = getMatchingAccounts(book, connectedCode);
      let transactions:Bkper.Transaction[] = []
      let connectedBookBalancesReport = connectedBook.getBalancesReport(query);
      for (const account of accounts) {
        let connectedAccount = connectedBook.getAccount(account.getName());
        if (connectedAccount != null) {

          let connectedAccountBalanceOnDate = getAccountBalance(connectedBookBalancesReport, connectedAccount);
          if (!connectedAccountBalanceOnDate) {
              continue;
          }
          
          let expectedBalance = ExchangeService.convert(connectedAccountBalanceOnDate, connectedCode, baseCode, exchangeRates);
          let accountBalanceOnDate = getAccountBalance(bookBalancesReport, account);
          if (!accountBalanceOnDate) {
              continue;
          }

          let delta = accountBalanceOnDate.minus(expectedBalance.amount);

          let excAccountName = getExcAccountName(book, connectedAccount, connectedCode);

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
            transaction.from(account).to(excAccount).setDescription('#exchange_loss');
            transactions.push(transaction)
            // if (book.getProperty(EXC_ON_CHECK, 'exc_auto_check')) {
            //   transaction.check();
            // }
            aknowledgeResult(result, excAccount, delta);
          } else if (deltaRounded.lt(0)) {
            transaction.from(excAccount).to(account).setDescription('#exchange_gain');
            transactions.push(transaction)

            // if (book.getProperty(EXC_ON_CHECK, 'exc_auto_check')) {
            //   transaction.check();
            // }
            aknowledgeResult(result, excAccount, delta);
          }
        }
      }

      book.batchCreateTransactions(transactions);
      
    });

    let stringResult: {[key: string]: string} = {}
    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        stringResult[key] = book.round(result[key]).toFixed(book.getFractionDigits())
      }
    }

    return {code: baseCode, result: JSON.stringify(stringResult)};
  }

    function getAccountBalance(balancesReport: Bkper.BalancesReport, account: Bkper.Account) {
        try {
            const connectedBalancesContainer = balancesReport.getBalancesContainer(account.getName());
            let connectedAccountBalanceOnDate = connectedBalancesContainer.getCumulativeBalance();
            return connectedAccountBalanceOnDate;
        } catch (error) {
            return null;
        }
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

  function getExcAccountName(book: Bkper.Book, connectedAccount: Bkper.Account, connectedCode: string): string {
    let excAccount = connectedAccount.getProperty(EXC_ACCOUNT_PROP)
    if (excAccount) {
      return excAccount;
    }
    let groups = connectedAccount.getGroups();
    if (groups) {
      for (const group of groups) {
        excAccount = group.getProperty(EXC_ACCOUNT_PROP)
        if (excAccount) {
          return excAccount;
        }
      }
    }
    let excAggregateProp = book.getProperty(EXC_AGGREGATE_PROP);
    if (excAggregateProp) {
      return `Exchange_${connectedCode}`;
    }
    if (groups) {
      for (const group of groups) {
        let stockExcCodeProp = group.getProperty(STOCK_EXC_CODE_PROP)
        if (stockExcCodeProp) {
          return `${connectedAccount.getName()} Unrealized EXC`;
        }
      }
    }
    return `${connectedAccount.getName()} EXC`;
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
      if (account.getName().endsWith(` EXC`)) {
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
      if (account.getName().endsWith(` EXC`)) {
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

  function getAccountQuery(book: Bkper.Book, date: Date, bookClosingDate: string, historicalProp: string): string {
      var dateAfter = new Date(date.getTime());
      dateAfter.setDate(dateAfter.getDate() + 1)
      if (!historicalProp && bookClosingDate) {
        let openingDate: Date;
        try {
          const closingDate = new Date();
          closingDate.setTime(book.parseDate(bookClosingDate).getTime());
          closingDate.setDate(closingDate.getDate() + 1);
          openingDate = closingDate;
        } catch (error) {
          throw `Error parsing book closing date: ${bookClosingDate}`
        }
        return `after:${book.formatDate(openingDate)} before:${book.formatDate(dateAfter)}`;
      } else {
        return `before:${book.formatDate(dateAfter)}`;
      }
  }

}


