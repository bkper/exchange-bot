BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

const EXC_RATES_URL_PROP = 'exc_rates_url';
const EXC_RATES_CACHE_PROP = 'exc_rates_cache';

function doGet(e: GoogleAppsScript.Events.AppsScriptHttpRequestEvent) {
  //@ts-ignore
  let bookId = e.parameter.bookId;
  return BotViewService.getGainLossViewTemplate(bookId);
}

function loadRates(bookId: string, date: string): Bkper.ExchangeRates {
  return BotViewService.loadRates(bookId, date);
}

function updateGainLoss(bookId: string, dateParam: string, exchangeRates: Bkper.ExchangeRates): Summary {
  return GainLossUpdateService.updateGainLoss(bookId, dateParam, exchangeRates);
}

function auditBooks(bookId: string) {
  BotViewService.auditBooks(bookId);
}

function updateTransactions(bookId: string, dateParam: string, exchangeRates: Bkper.ExchangeRates): Summary {
  return TransactionsUpdateService.updateTransactions(bookId, dateParam, exchangeRates);
}


function onTransactionDeleted(event: bkper.Event) {
  return new EventHandlerTransactionDeleted().handleEvent(event);
}

function onTransactionRestored(event: bkper.Event) {
  return new EventHandlerTransactionRestored().handleEvent(event);
}

function onTransactionUpdated(event: bkper.Event) {
  return new EventHandlerTransactionUpdated().handleEvent(event);
}

function onTransactionChecked(event: bkper.Event) {
  return new EventHandlerTransactionChecked().handleEvent(event);
}

function onAccountCreated(event: bkper.Event) {
  return new EventHandlerAccountCreatedOrUpdated().handleEvent(event);
}

function onAccountUpdated(event: bkper.Event) {
  return new EventHandlerAccountCreatedOrUpdated().handleEvent(event);
}

function onAccountDeleted(event: bkper.Event) {
  return new EventHandlerAccountDeleted().handleEvent(event);
}

function onGroupCreated(event: bkper.Event) {
  return new EventHandlerGroupCreatedOrUpdated().handleEvent(event);
}

function onGroupUpdated(event: bkper.Event) {
  return new EventHandlerGroupCreatedOrUpdated().handleEvent(event);
}

function onGroupDeleted(event: bkper.Event) {
  return new EventHandlerGroupDeleted().handleEvent(event);
}

function onBookUpdated(event: bkper.Event) {
  return new EventHandlerBookUpdated().handleEvent(event);
}








