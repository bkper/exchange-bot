The Exchange Bot helps you keep multiple Books in different currencies in sync.

It works by mirroring transactios from one book to other books, automatically applying updated conversions rates.

![Exchange Bot](https://docs.google.com/drawings/d/e/2PACX-1vTAW6vvlAPHup58L5mwdiQnUVoSxHbf890GJiHYVkLmzhAc0kaGsb8B721vc1pRFVXp2OWx8rBiACMR/pub?w=949&h=436)


For every transaction in a base book, it will generate another transaction on associated books, with different currencies.

The Bot also adds a menu item to your books too update gains and losses, based on exchange rates variation.

![Exchange Bot Menu](https://docs.google.com/drawings/d/e/2PACX-1vSA-k4mJouFSGPUc8wH2J6o67qKs7jxYkk4VygH-6WA5uwdPAw5k5Jq42MhIvznj0EszPrAlIU_pHXm/pub?w=1200&h=400)

The Exchange Bot uses rates from [exchangeratesapi.io](https://exchangeratesapi.io/) by default, but any rates source endpoint can be used.


## Configuration

The Exchange Bot work by listening for TRANSACTION_POSTED events in your book, applying exchange rates from the an **exchange rates endpoint** and recording another transaction to the associated books:

![Exchange Bot Flow](https://docs.google.com/drawings/d/e/2PACX-1vSgg3HznU8deJsYNuZx57XvOusDTg-t6MwNIBpF2RuJRMzz-eFY4LhbCP1giOaO1mR3pD3K1gvEIz5i/pub?w=960&h=416)


### Book Properties

In order to proper setup the Exchange Bot on your books, some book properties should be set:

- ```exc_code```: Required - The book (currency) exchange code.
- ```exc_books```: Required - The id of associated book(s), splitted by spaces if more than one.
- ```exc_rates_url```: Optional - The rates endpoint url to use. Default: [exchangeratesapi.io](https://exchangeratesapi.io/). 
- ```exc_rates_cache```: Optional - The exchange rates endpoint url cache, **in seconds**. Default: ```3600```.
- ```exc_acc_prefix```: Optional - The prefix in which each Gain/Loss account will use. Default: ```Exchange_```.

You can associate multiple books.

Example:
```yaml
exc_code: USD
exc_books: agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAwJWHgJQLDA agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAwLWdrOEJDA
```

### Fixed Amounts

To bypass dynamic rates from endpoint and force use of fixed amounts, just append the currency symbol and amount in the transaction description.

Example:
```
Citibank Itau 1000 UYU35790.76 remitence from USA
```

That will generate a transaction in the current book of amount $1000, as well as another transaction on UYU book of $U35790.76.


### Exchange rates endpoint

By default, the free [exchangeratesapi.io](https://exchangeratesapi.io/) endpoint is used to fetch rates, but any endpoint can be provided, from other third party providers such as [Fixer](https://fixer.io/) or [Open Exchange Rates](https://openexchangerates.org/). 

To change the default endpoint, set the ```exc_rates_url``` book property. 

Example:
```yaml
exc_rates_url: https://data.fixer.io/api/${date}?access_key=*****
exc_rates_cache: 3600  #optional cache
```

**Supported expressions:**

- ```${date}```: The date of transaction in the standard ISO format ```yyyy-mm-dd```.
- ```${agent}```: The agent for the fetch request. 'app' for Gain/Loss update from menu. 'bot' for transaction post.


Despite of which endpoint choosed, the json format returned MUST be:

```typescript
{
  base: string;
  date: string;
  rates: {
    [key: string]: number;
  }
}
```

Example:

```json
{
  "base": "EUR",
  "rates": {
    "CAD": 1.565,
    "CHF": 1.1798,
    "GBP": 0.87295,
    "SEK": 10.2983,
    "EUR": 1.092,
    "USD": 1.2234,
  }
}


