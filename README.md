The Exchange Bot helps you keep multiple Books in different currencies in sync.

It works by mirroring transactios from one Book to other books, applying updated conversions rates automatically.

![](https://docs.google.com/drawings/d/e/2PACX-1vT-T1Yb3KM6BfdeTyFLtB2EQP18REd-dxqJG41nu0Ld4sgUvAXeGE4eCE3rxWcBWUqJdArm4KPoHruU/pub?w=885&h=786)

For every transaction in a base book, it will generate another transaction on associated books, with different currencies.

It support operating on two or more books.

## Configuration

### Book Properties

- ```exchange_code```: The book (currency) exchange code in [ISO4217](https://en.wikipedia.org/wiki/ISO_4217)
- ```exchange_XXX_book```: The id of associated book

You can associate multiple books.

Example:
```yaml
exchange_code: USD
exchange_UYU_book: agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAwJWHgJQLDA
exchange_BRL_book: agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAwLWdrOEJDA
```

To force use fixed amounts, just append the currency symbol and amount in the transaction description.

Example:

```
Citibank Itau 1000 UYU35790.76 remitence from USA
```

That will generate a transaction in the current book of amount $1000, as well as another transaction on UYU book of $U35790.76.


