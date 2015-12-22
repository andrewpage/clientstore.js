/*
  ClientStore is a standard interface for storing client side data.
  It's standard methods (set, get) are defined at runtime based on the availability
  of certain client-side storage libraries (WebStorage).

  ClientStore also includes functionality for expiration of WebStorage entries,
  which is not supported by default by the WebStorage standard.

  Author: Andrew Page <andrew@andrewpage.me>
  Copyright (c) 2015

  MIT License - http://opensource.org/licenses/mit-license.php
*/

var ClientStore = function(options) {
  this.options = options || {};

  if(this.isWebStorageSupported() && !cookiesShouldBeForced()) {
    // Methods for WebStorage based client-side storage
    this.get = this.getWebStorage;
    this.set = this.setWebStorage;
    this.expire = this.expireWebStorage;
  } else {
    // Methods for Cookie based client-side storage
    this.get = this.getCookie;
    this.set = this.setCookie;

    // No need to manually expire cookies
    this.expire = function() {};
  }
};

ClientStore.prototype = {

  /*
    Determines if we're able to use WebStorage
  */
  isWebStorageSupported: function() {
    return typeof(Storage) !== 'undefined';
  },

  /*
    Should we exclusively use cookies?
  */
  cookiesShouldBeForced: function() {
    return this.options.forceCookies == true;
  },

  /*
    Should we exclusively use cookies?
  */
  webStorageShouldPersist: function() {
    return this.options.persistent == true;
  },

  /*
    Returns the WebStorage mechanism to use (persistent LocalStorage vs. short-lived SessionStorage)
  */
  getWebStorageMechanism: function() {
    if(webStorageShouldPersist()) {
      return localStorage;
    } else {
      return sessionStorage;
    }
  },

  /*
    Sets a value using WebStorage
  */
  setWebStorage: function(key, value, expiration) {
    // If we have specified an expiration date, apply it
    var expiration = null;
    if(typeof expiration !== 'undefined') {
      var date = new Date();

      // Set the time to N days in the future.
      date.setTime(date.getTime() + expiration);

      expiration = date.getTime();
    }

    // Include the expiration date in the payload
    var payload = {
      expiration: expiration,
      data: value
    };

    // Store the data
    getWebStorageMechanism().setItem(key, JSON.stringify(payload));
  },

  /*
    Sets a value using Cookies
  */
  setCookie: function(key, value, expiration) {
    var keyValueString = key + "=" + value;
    var expirationString = "";

    // If we've defined a length of expiration, configure it here
    if(typeof expiration !== 'undefined') {
      var date = new Date();

      // Set the time to N days in the future.
      date.setTime(date.getTime() + (expiration));

      /* Creates a string defining the expiration date in the format that the browser
        requires */
      var expirationKV = "expires=" + date.toUTCString();
      expirationString = "; " + expirationKV;
    }

    document.cookie = keyValueString + expirationString;
  },

  /*
    Gets a value using WebStorage
  */
  getWebStorage: function(key) {
    // Get stored payload
    var storedData = getWebStorageMechanism().getItem(key);
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

  /*
    Gets a value using Cookies
  */
  getCookie: function(key) {
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

  /*
    Garbage collection like function that expires all WebStorage data.
  */
  expireWebStorage: function() {
    // Current timestamp
    var now = new Date().getTime();
    var wsMechanism = getWebStorageMechanism();

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

// Executes GC
new ClientStore().expire();
