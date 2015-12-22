/*
  ClientStore is a standard interface for storing client side data.
  It's standard methods (set, get) are defined at runtime based on the availability
  of certain client-side storage libraries (localStorage).

  ClientStore also includes functionality for expiration of LocalStorage entries,
  which is not supported by default by the LocalStorage standard.

  Author: Andrew Page <andrew@andrewpage.me>
  Copyright (c) 2015

  MIT License - http://opensource.org/licenses/mit-license.php
*/

var ClientStore = function() {
  if(this.isLocalStorageSupported()) {
    // Methods for LocalStorage based client-side storage
    this.get = this.getLocal;
    this.set = this.setLocal;
    this.expire = this.expireLocal;
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
    Determines if we're able to use LocalStorage
  */
  isLocalStorageSupported: function() {
    return typeof(Storage) !== 'undefined';
  },

  /*
    Sets a value using LocalStorage
  */
  setLocal: function(key, value, expirationDays) {
    // If we have specified an expiration date, apply it
    var expiration = null;
    if(typeof expirationDays !== 'undefined') {
      var date = new Date();

      // Set the time to N days in the future.
      date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));

      expiration = date.getTime();
    }

    // Include the expiration date in the payload
    var payload = {
      expiration: expiration,
      data: value
    };

    // Store the data
    localStorage.setItem(key, JSON.stringify(payload));
  },

  /*
    Sets a value using Cookies
  */
  setCookie: function(key, value, expirationDays) {
    var keyValueString = key + "=" + value;
    var expirationString = "";

    // If we've defined a length of expiration, configure it here
    if(typeof expirationDays !== 'undefined') {
      var date = new Date();

      // Set the time to N days in the future.
      date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));

      /* Creates a string defining the expiration date in the format that the browser
        requires */
      var expiration = "expires=" + date.toUTCString();
      expirationString = "; " + expiration;
    }

    document.cookie = keyValueString + expirationString;
  },

  /*
    Gets a value using LocalStorage
  */
  getLocal: function(key) {
    // Get stored payload
    var storedData = localStorage.getItem(key);
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
    Garbage collection like function that expires all LocalStorage data.
  */
  expireLocal: function() {
    // Current timestamp
    var now = new Date().getTime();

    // Loop over all data stored in LocalStorage
    for(var key in localStorage) {
      // Get value for key in LocalStorage (String)
      var value = localStorage.getItem(key);

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
            localStorage.removeItem(key);
          }
        }
      } catch(err) { /* Cannot Expire */ }
    }
  }
};

// Executes GC
new ClientStore().expire();
