# ClientStore.js
ClientStore.js is a JavaScript shim/library that provides a browser-support agnostic interface to both client-side data storage options, WebStorage and Cookies.

## Usage

```javascript
// Instantiate a new ClientStore object
var clientStore = new ClientStore({
    // Pass any options in this parameter
    persistent: true,
    expirationMultiplier: 1000
});

// Use the set() method to set a key and its value
clientStore.set('key', 'This is ClientStore!');

// Pass in a third parameter to define an expiration time.
// Expiration time is defined in milliseconds
clientStore.set('expiringKey', 'This will expire in 5 seconds!', 5000);

// Use the get() method to retrieve a value for a given key
var value = clientStore.get('key'); // value = This is ClientStore!

// Call expire() to check all WebStorage entries, and clean out the ones that have expired. expire() is automatically called on page load.
clientStore.expire();
```

The same syntax (`set` and `get`) applies to both WebStorage and Cookie based client-side storage, with or without an expiration time.

### Options

There are a number of configuration options that you can pass to ClientStore. The options parameter is an Object, and each of these options is a key on that Object.

Name | Type | Description
:---- | :----: | --------------
persistent | Boolean | Determines whether LocalStorage (`true` value) or SessionStorage (`false` value) will be used if WebStorage is available.
forceCookies | Boolean | Force usage of Cookie storage and completely bypass any WebStorage compatibility checks.
expirationMultiplier | Integer | Any value passed to `set()` as the expiration time will be multiplied by this multiplier. e.g. `1000` if you would like to specify expiration time in seconds, `86400000` if you would like to specify expiration time in days.


## Contributing
See the [contributing](CONTRIBUTING.md) file for information on making contributions to ClientStore.js. Email me at andrew (at) andrewpage (dot) me if you have any questions.
