BkperApp.setApiKey(PropertiesService.getScriptProperties().getProperty('API_KEY'));

function doGet(e: GoogleAppsScript.Events.AppsScriptHttpRequestEvent) {
  //@ts-ignore
  let bookId = e.parameter.bookId;
  return GainLossUpdateService_.getGainLossViewTemplate(bookId);
}

function updateGainLoss(bookId: any, dateParam: string): void {
  GainLossUpdateService_.updateGainLoss(bookId, dateParam);
}

function onTransactionEdited(event: bkper.Event) {
  return TransactionEditedHandler_.handleTransactionEdited(event);
}

function onTransactionChecked(event: bkper.Event) {
  return TransactionCheckedHandler_.handleTransactionChecked(event);
}






