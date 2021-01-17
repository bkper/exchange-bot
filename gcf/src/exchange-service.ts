import { ExchangeRates } from "./ExchangeRates";

export async function convert(value: number, from: string, to: string, ratesEndpointUrl: string, cacheInSeconds: number): Promise<number> {

  if (ratesEndpointUrl == null) {
    throw 'exchangeRatesUrl must be provided.'
  }

  let rates = await getRates(ratesEndpointUrl, cacheInSeconds);

  rates = convertBase(rates, from);

  if (rates == null) {
    throw `Code ${from} not found in ${JSON.stringify(rates)}`
  }

  let rate = rates.rates[to];
  if (rate == null) {
    throw `Code ${to} not found in ${JSON.stringify(rates)}`
  }
  return rate * value;
}

function convertBase(rates: ExchangeRates, toBase: string): ExchangeRates {
  rates.rates[rates.base] = 1
  if (rates.base == toBase) {
    return rates;
  }
  let rate = rates.rates[toBase]
  if (rate == null) {
    return null;
  }
  let newRate = 1 / rate;
  rates.base = toBase;
  for (let [key, value] of Object.entries(rates.rates)) {
    rates.rates[key] = value * newRate;
  }
  return rates;
}

async function getRates(ratesEndpointUrl: string, cacheInSeconds: number): Promise<ExchangeRates> {
  let cachedRatesJson = CacheService.getScriptCache().get(ratesEndpointUrl)
  if (cachedRatesJson != null) {
    return JSON.parse(cachedRatesJson);
  } else {
    let request = HttpRequestApp.newRequest(ratesEndpointUrl);


    let ratesJson = request.fetch().getContentText();
    let rates: ExchangeRates = JSON.parse(ratesJson);

    if (rates == null) {
      throw `Unable to get exchange rates from endpoint ${ratesEndpointUrl}`;
    }

    if (rates.base == null || rates.rates == null) {
      throw `Rates json from ${ratesEndpointUrl} in wrong format. Expected:
        {
          base: string;
          date: string;
          rates: {
            [key: string]: number;
          }
        }
        `;
    }

    if (!cacheInSeconds) {
      cacheInSeconds = 3600;
    }

    CacheService.getScriptCache().put(ratesEndpointUrl, ratesJson, cacheInSeconds);

    return rates;
  }
}