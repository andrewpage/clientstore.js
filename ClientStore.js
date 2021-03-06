/**
 * ClientStore is a standard interface for storing client side data.
 * It's standard methods (set, get) are defined at runtime based on the availability
 * of certain client-side storage libraries (WebStorage).
 *
 * ClientStore also includes functionality for expiration of WebStorage entries,
 * which is not supported by default by the WebStorage standard.
 *
 * @author Andrew Page <andrew@andrewpage.me>
 * @copyright Andrew Page (c) 2015
 * @license MIT
 *
 * @constructor
 * @param {object} options - Options to instantiate a ClientStore object.
 * @param {boolean} options.forceCookies - Should cookies always be used as the storage mechanism?
 * @param {boolean} options.persistent - Should data be restricted to the session or persistent across sessions?
 * @param {number} options.expirationMultiplier - Multiplier for the expiration time. By default, this is set to 1, which means expiration time is specified in milliseconds.
*/
var ClientStore = function(options) {
  this.options = options || {};

  if(!this._shouldCookiesBeForced() && this._isWebStorageSupported()) {
    // Methods for WebStorage based client-side storage
    this.get = this._getWebStorage;
    this.set = this._setWebStorage;
    this.expire = this._expireWebStorage;
  } else {
    // Methods for Cookie based client-side storage
    this.get = this._getCookie;
    this.set = this._setCookie;
  }
};

ClientStore.prototype = {
  /**
   * Retreives a value from the ClientStore.
   *
   * @param {string} key - Key of stored object to retrieve.
   * @returns {object}
   */
  get: function(key) {},

  /**
   * Stores a value in the ClientStore.
   *
   * @param {string} key - Key to store object at.
   * @param {string} value - Value to store at key.
   * @param {number} expiration - Time (default in milliseconds) until this record expires.
   */
  set: function(key, value, expiration) {},

  /**
   * Remove all expired entries.
   */
  expire: function() {},

  /**
   * Determines if we're able to use WebStorage.
   *
   * @private
   * @returns {boolean}
   */
  _isWebStorageSupported: function() {
    return typeof(Storage) !== 'undefined';
  },

  /**
   * Should we exclusively use cookies?
   *
   * @private
   * @returns {boolean}
   */
  _shouldCookiesBeForced: function() {
    return this.options.forceCookies == true;
  },

  /**
   * Should WebStorage persist or be session dependent?
   *
   * @private
   * @returns {boolean}
   */
  _webStorageShouldPersist: function() {
    return this.options.persistent == true;
  },

  /**
   * Get expiration multiplier
   *
   * @private
   * @returns {number}
   */
  _getExpirationMultiplier: function() {
    return this.options.expirationMultiplier || 1;
  },

  /**
   * Returns the WebStorage mechanism to use (persistent LocalStorage vs. short-lived SessionStorage)
   *
   * @private
   * @returns {object}
   */
  _getWebStorageMechanism: function() {
    return this._webStorageShouldPersist() ? localStorage : sessionStorage;
  },

  /**
   * Calculate expiration time, factoring in multiplier.
   *
   * @private
   * @param {number} expiration - User-specified number stating the expiration time.
   * @returns {number}
   */
  _calculateExpirationTime: function(expiration) {
    var expirationDate = null;

    if(typeof expiration !== 'undefined' && expiration !== null) {
      expiration = expiration * this._getExpirationMultiplier();

      // Get timestamp from now + expiration
      var date = new Date();
      date.setTime(date.getTime() + expiration);
      expirationDate = date.getTime();
    }

    return expirationDate;
  },

  /**
   * Sets a value using WebStorage.
   *
   * @private
   * @param {string} key - Key of value to set.
   * @param {string} value - Value to set.
   * @param {number} expiration - Expiration of entry.
   */
  _setWebStorage: function(key, value, expiration) {
    // If we have specified an expiration date, apply it
    var expiration = this._calculateExpirationTime(expiration);

    // Include the expiration date in the payload
    var payload = {
      expiration: expiration,
      data: value
    };

    // Store the data
    this._getWebStorageMechanism().setItem(key, JSON.stringify(payload));
  },

  /**
   * Sets a value using Cookies
   *
   * @private
   * @param {string} key - Key of value to set.
   * @param {string} value - Value to set.
   * @param {number} expiration - Expiration of entry.
   */
  _setCookie: function(key, value, expiration) {
    var keyValueString = key + "=" + value;
    var expirationString = "";

    var expiration = this._calculateExpirationTime(expiration);

    if(expiration) {
      var date = new Date(expiration);

      var expirationKV = "expires=" + date.toUTCString();
      expirationString = "; " + expirationKV;
    }

    document.cookie = keyValueString + expirationString;
  },

  /**
   * Retrieves a value using WebStorage
   *
   * @private
   * @param {string} key - Key of value to retrieve.
   * @returns {string}
   */
  _getWebStorage: function(key) {
    // Get stored payload
    var storedData = this._getWebStorageMechanism().getItem(key);
    var data = null;

    // If the key is valid
    if(storedData !== null) {
      // Parse & return the stored data within the payload
      try {
        data = JSON.parse(storedData).data;
      } catch(err) {
        data = storedData;
      }
    }

    return data;
  },

  /**
   * Retrieves a value using Cookies
   *
   * @private
   * @param {string} key - Key of value to retrieve.
   * @returns {string}
   */
  _getCookie: function(key) {
    var name = key + "=";
    var ca = document.cookie.split(';');

    // Parse out all cookies from string
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }

    return null;
  },

  /**
   * Garbage collection like function that expires all WebStorage data.
   *
   * @private
   */
  _expireWebStorage: function() {
    // Current timestamp
    var now = new Date().getTime();
    var wsMechanism = this._getWebStorageMechanism();

    // Loop over all data stored in WebStorage
    for(var key in wsMechanism) {
      // Get value for key in WebStorage (String)
      var value = wsMechanism.getItem(key);

      try {
        // Parse JSON
        var payload = JSON.parse(value);

        // If we have an expiration date
        var expirationStr = payload.expiration;
        if(expirationStr !== null) {
          // Get the timestamp
          var timestamp = Number(expirationStr);

          // If we've passed the expiration date...
          if(now > timestamp) {
            // Remove the item
            wsMechanism.removeItem(key);
          }
        }
      } catch(err) { /* Cannot Expire */ }
    }
  }
};

module.exports = ClientStore;
