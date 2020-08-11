BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

function doGet(e: GoogleAppsScript.Events.AppsScriptHttpRequestEvent) {
  //@ts-ignore
  let bookId = e.parameter.bookId;
  return GainLossUpdateService_.getGainLossViewTemplate(bookId);
}

function updateGainLoss(bookId: any, dateParam: string): void {
  GainLossUpdateService_.updateGainLoss(bookId, dateParam);
}

function onTransactionUnchecked(event: bkper.Event) {
  return TransactionUncheckedHandler_.handleTransactionUnchecked(event);
}

function onTransactionChecked(event: bkper.Event) {
  return TransactionCheckedHandler_.handleTransactionChecked(event);
}






