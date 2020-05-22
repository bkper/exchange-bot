The Exchange Bot helps you keep multiple Books in different currencies in sync.

It works by mirroring transactios from one book to other books, automatically applying updated conversions rates.

![Exchange Bot](https://docs.google.com/drawings/d/e/2PACX-1vTAW6vvlAPHup58L5mwdiQnUVoSxHbf890GJiHYVkLmzhAc0kaGsb8B721vc1pRFVXp2OWx8rBiACMR/pub?w=949&h=436)



For every transaction in a base book, it will generate another transaction on associated books, with different currencies.

The Bot also adds an menu item to your books too update gains and losses, based on exchange rates variation.

![Exchange Bot Menu](https://docs.google.com/drawings/d/e/2PACX-1vSA-k4mJouFSGPUc8wH2J6o67qKs7jxYkk4VygH-6WA5uwdPAw5k5Jq42MhIvznj0EszPrAlIU_pHXm/pub?w=1200&h=400)

The Exchange Bot uses rates from [exchangeratesapi.io](https://exchangeratesapi.io/) by default, but any rates source endpoint can be used.

It support operating on two or more books.

## Configuration

### Book Properties

- ```exc_code```: The book (currency) exchange code.
- ```exc_rates_url```: The rates endpoint url to use. Accepts ```${date}``` expression for current transaction date. If not provided, the [exchangeratesapi.io](https://exchangeratesapi.io/) API endpoint will be used. 
- ```exc_rates_cache```: The rates endpoint url cache, **in seconds**. 
- ```exc_XXX_book```: The id of associated book(s).
- ```exc_acc_prefix```: The prefix in which each Gain/Loss account will use. If not set, a single account for each associated book code will be used. E.g. ```Exchange_EUR```

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


