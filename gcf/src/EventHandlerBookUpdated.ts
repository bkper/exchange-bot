import { Book } from "bkper";
import { getBaseCode } from "./BotService";
import { EXC_AUTO_CHECK_PROP, EXC_RATES_CACHE_PROP, EXC_RATES_URL_PROP } from "./constants";
import { EventHandler } from "./EventHandler";

export class EventHandlerBookUpdated extends EventHandler {

  protected async processObject(baseBook: Book, connectedBook: Book, event: bkper.Event): Promise<string> {
    let connectedCode = getBaseCode(connectedBook);

    let response = ''

    if (connectedCode != null && connectedCode != '') {

      if (baseBook.getFractionDigits() != connectedBook.getFractionDigits()) {
        connectedBook.setFractionDigits(baseBook.getFractionDigits())
        response += ` decimal places: ${baseBook.getFractionDigits()}`
      }
      
      if (baseBook.getDatePattern() != connectedBook.getDatePattern()) {
        connectedBook.setDatePattern(baseBook.getDatePattern())
        response += ` date pattern: ${baseBook.getDatePattern()}`
      }
      
      if (baseBook.getDecimalSeparator() != connectedBook.getDecimalSeparator()) {
        connectedBook.setDecimalSeparator(baseBook.getDecimalSeparator())
        response += ` decimal separator: ${baseBook.getDecimalSeparator()}`
      }
      
      if (baseBook.getTimeZone() != connectedBook.getTimeZone()) {
        connectedBook.setTimeZone(baseBook.getTimeZone())
        response += ` time zone: ${baseBook.getTimeZone()}`
      }

      if (baseBook.getPageSize() != connectedBook.getPageSize()) {
        connectedBook.setPageSize(baseBook.getPageSize())
        response += ` page size: ${baseBook.getPageSize()}`
      }

      if (baseBook.getPeriod() != connectedBook.getPeriod()) {
        connectedBook.setPeriod(baseBook.getPeriod())
        response += ` period: ${baseBook.getPeriod()}`
      }

      console.log(baseBook.getPeriodStartMonth())

      if (baseBook.getPeriodStartMonth() != connectedBook.getPeriodStartMonth()) {
        connectedBook.setPeriodStartMonth(baseBook.getPeriodStartMonth())
        response += ` period start month: ${baseBook.getPeriodStartMonth()}`
      }

      const baseExcRatesUrl = baseBook.getProperty(EXC_RATES_URL_PROP);
      if (baseExcRatesUrl && baseExcRatesUrl != connectedBook.getProperty(EXC_RATES_URL_PROP)) {
        connectedBook.setProperty(EXC_RATES_URL_PROP, baseExcRatesUrl)
        response += ` ${EXC_RATES_URL_PROP}: ${baseExcRatesUrl}`
      }

      const baseExcRatesCache = baseBook.getProperty(EXC_RATES_CACHE_PROP);
      if (baseExcRatesCache && baseExcRatesCache != connectedBook.getProperty(EXC_RATES_CACHE_PROP)) {
        connectedBook.setProperty(EXC_RATES_CACHE_PROP, baseExcRatesCache)
        response += ` ${EXC_RATES_CACHE_PROP}: ${baseExcRatesCache}`
      }
      
      const excAutoCheck = baseBook.getProperty(EXC_AUTO_CHECK_PROP);
      if (excAutoCheck && excAutoCheck != connectedBook.getProperty(EXC_AUTO_CHECK_PROP)) {
        connectedBook.setProperty(EXC_AUTO_CHECK_PROP, excAutoCheck)
        response += ` ${EXC_AUTO_CHECK_PROP}: ${excAutoCheck}`
      }
      
    }

    if (response != '') {
      await connectedBook.update();
      return `${this.buildBookAnchor(connectedBook)}: ${response}`;
    }

    return null;

  }


}