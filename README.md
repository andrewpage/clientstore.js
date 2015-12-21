# ClientStore.js

ClientStore.js is a JavaScript library that provides an agnostic interface to both client-side data storage options, WebStorage and Cookies.

## Usage

Initialize a new ClientStore object.

```javascript
var clientStore = new ClientStore();
```

ClientStore will automatically detect availability of WebStorage in your browser. If WebStorage is available, all future calls will delegate to the WebStorage methods. If WebStorage is unavailable. All future calls will delegate to the Cookie methods.

```javascript
clientStore.set('key', 'This is ClientStore!');
var value = clientStore.get('key'); // val = This is ClientStore!
```
