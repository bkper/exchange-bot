The Exchange Bot helps you keep multiple Books in different currencies in sync.

It works by mirroring transactios from one Book to other books, automatically applying updated conversions rates.

![Exchange Bot](https://docs.google.com/drawings/d/e/2PACX-1vTAW6vvlAPHup58L5mwdiQnUVoSxHbf890GJiHYVkLmzhAc0kaGsb8B721vc1pRFVXp2OWx8rBiACMR/pub?w=888&h=389)

For every transaction in a base book, it will generate another transaction on associated books, with different currencies.

It support operating on two or more books.

## Configuration

### Book Properties

- ```exc_code```: The book (currency) exchange code in [ISO4217](https://en.wikipedia.org/wiki/ISO_4217)
- ```exc_rates_url```: The rates endpoint url to use. Accepts ```${date}``` expression for current transaction date. If not provided, the [exchangeratesapi.io](https://exchangeratesapi.io/) will be used
- ```exc_rates_cache```: The rates endpoint url cache, **in seconds**. 
- ```exc_XXX_book```: The id of associated book

You can associate multiple books.

Example:
```yaml
exc_code: USD
exc_rates_url: https://data.fixer.io/api/${date}?access_key=XXXX
exc_UYU_book: agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAwJWHgJQLDA
exc_BRL_book: agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAwLWdrOEJDA
```

### Fixed Amounts

To bypass dynamic rates from endpoint and force use of fixed amounts, just append the currency symbol and amount in the transaction description.

Example:

```
Citibank Itau 1000 UYU35790.76 remitence from USA
```

That will generate a transaction in the current book of amount $1000, as well as another transaction on UYU book of $U35790.76.


