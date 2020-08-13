BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

function doGet(e: GoogleAppsScript.Events.AppsScriptHttpRequestEvent) {
  //@ts-ignore
  let bookId = e.parameter.bookId;
  return GainLossUpdateService_.getGainLossViewTemplate(bookId);
}

function updateGainLoss(bookId: any, dateParam: string): void {
  GainLossUpdateService_.updateGainLoss(bookId, dateParam);
}


function onTransactionDeleted(event: bkper.Event) {
  return new EventHandlerTransactionDeleted().handleEvent(event);
}

function onTransactionRestored(event: bkper.Event) {
  return new EventHandlerTransactionRestored().handleEvent(event);
}

function onTransactionEdited(event: bkper.Event) {
  return new EventHandlerTransactionEdited().handleEvent(event);
}

function onTransactionChecked(event: bkper.Event) {
  return new EventHandlerTransactionChecked().handleEvent(event);
}






