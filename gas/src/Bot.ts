BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

const EXC_RATES_URL_PROP = 'exc_rates_url';
const EXC_RATES_CACHE_PROP = 'exc_rates_cache';

function doGet(e: GoogleAppsScript.Events.AppsScriptHttpRequestEvent) {
  //@ts-ignore
  let bookId = e.parameter.bookId;
  return BotViewService.getGainLossViewTemplate(bookId);
}

function loadRates(bookId: string, date: string): ExchangeRates {
  return BotViewService.loadRates(bookId, date);
}

function updateGainLoss(bookId: string, dateParam: string, exchangeRates: ExchangeRates): Summary {
  return GainLossUpdateService.updateGainLoss(bookId, dateParam, exchangeRates);
}

function auditBooks(bookId: string) {
  BotViewService.auditBooks(bookId);
}

function updateTransactions(bookId: string, dateParam: string, exchangeRates: ExchangeRates): Summary {
  return TransactionsUpdateService.updateTransactions(bookId, dateParam, exchangeRates);
}







