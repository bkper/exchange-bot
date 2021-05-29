import { ExchangeRates } from "./ExchangeRates";
import { GaxiosError, request } from 'gaxios';
import https = require('https');

import NodeCache = require("node-cache");
import { Amount } from "bkper";
const cache = new NodeCache();

interface ConvertedAmount {
  amount?: Amount;
  base: string;
  rate: Amount;
}

export async function convert(value: Amount, from: string, to: string, ratesEndpointUrl: string, cacheInSeconds: number): Promise<ConvertedAmount> {

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

  return {
    base: rates.base,
    rate: new Amount(rate),
    amount: new Amount(rate).times(value)
  };
}

function convertBase(rates: ExchangeRates, toBase: string): ExchangeRates {
  rates.rates[rates.base] = '1'
  if (rates.base == toBase) {
    return rates;
  }
  let rate = rates.rates[toBase]
  if (rate == null) {
    return null;
  }
  let newRate = new Amount('1').div(rate);
  rates.base = toBase;
  for (let [key, value] of Object.entries(rates.rates)) {
    try {
      rates.rates[key] = new Amount(value).times(newRate).toString();
    } catch (error) {
      //ok
    }
  }
  return rates;
}

export async function getRates(ratesEndpointUrl: string, cacheInSeconds: number): Promise<ExchangeRates> {
  console.time('getRates')
  let rates: ExchangeRates = cache.get(ratesEndpointUrl);
  if (rates != null) {
    return rates;
  } else {

    console.warn(`Fetching rates from ${ratesEndpointUrl}`)

    let req = await request({
      url: ratesEndpointUrl,
      method: 'GET',
      agent: new https.Agent({keepAlive: true}),
      retryConfig: {
        retry: 5,
        onRetryAttempt: (err: GaxiosError) => {console.log(`${err.message} - Retrying... `)},
        retryDelay: 100
      }
    })

    rates = req.data as ExchangeRates;

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

    if (cacheInSeconds == null || cacheInSeconds > 3600) {
      cacheInSeconds = 3600;
    } else if (cacheInSeconds < 300) {
      cacheInSeconds = 300;
    }

    cache.set( ratesEndpointUrl, rates, cacheInSeconds );

    console.timeEnd('getRates')

    return rates;
  }
}