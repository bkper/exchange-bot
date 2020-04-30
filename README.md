The Currency Converter bot helps you keep multiple Books in different currencies in sync.

It works by mirroring transactios from one Book to other books, applying updated conversions rates automatically.

![](https://docs.google.com/drawings/d/e/2PACX-1vT-T1Yb3KM6BfdeTyFLtB2EQP18REd-dxqJG41nu0Ld4sgUvAXeGE4eCE3rxWcBWUqJdArm4KPoHruU/pub?w=885&h=786)

For every transaction in a base book, it will generate another transaction on associated books, with different currencies.

Transfer between permanent accounts with currencies defined are done by entering the amounts in each currency in the transaction description.

Example:

```
Citibank Itau 1000 UYU35790.76 remitence from USA
```

Recording directly the USD book, will generate a transaction in the current book of amount $1000, as well as another transaction on UYU book of $U35790.76.

It support operating on two or more books.

## Configuration

### Book Properties

- ```currency```: The book currency code in [ISO4217](https://en.wikipedia.org/wiki/ISO_4217)
- ```currency_XXX_book```: The id of associated book

You can associate multiple books. Example:

```yaml
currency: USD
currency_UYU_book: agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAwJWHgJQLDA
currency_BRL_book: agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAwLWdrOEJDA
```

### Account properties

- ```currency```: The account currency code in [ISO4217](https://en.wikipedia.org/wiki/ISO_4217)

Only permanent accounts, such as assets or liabilities, should have its currency defined.
