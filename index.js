var fs = require("fs"),
    contentful = require("contentful"),
    helpers = require("./lib/helpers.js");

function throwError(err) {
  console.log(err.stack);
}

/*
  ContentfulPull
    Main constructor
*/
function ContentfulPull(settings) {
  this.currentSyncToken = null;
  
  // Holds all the downloaded data in memory
  this.data = null;
  
  this.defaultSettings = {
    path: null,
    space: null,
    accessToken: null
  }
  this.settings = settings;
}

/*
  ContentfulSynchronize.sync
    syncs the contentful
*/
ContentfulPull.prototype.sync = function(options) {
  var _this = this;
  
  console.log("ContentfulPull | Syncing...");
  
  var options = {initial: false};
  var d = Promise.defer();
  
  var client = contentful.createClient({
    space: this.settings.space,
    accessToken: this.settings.accessToken
  })
  
  var isInitial = this.currentSyncToken ? false : true;
  if (options.initial) isInitial = true;
  var resolveLinks = options.resolveLinks;
  
  var spacePromise = client.getSpace();
  var contentTypesPromise = client.getContentTypes();
  var syncPromise = client.sync({initial: isInitial, resolveLinks: false, nextSyncToken: this.currentSyncToken});
  
  Promise.all([spacePromise, contentTypesPromise, syncPromise]).then(function(result) {
    var handledData = _this.handleSyncResponse({
      spaceData: result[0],
      contentTypesData: result[1],
      syncData: result[2]
    });
    
    d.resolve(handledData.content);
  });
  
  return d.promise;
};

/*
  ContentfulSynchronize.handleResponse
    Handles the response from Contentful
*/
ContentfulPull.prototype.handleSyncResponse = function(resp) {
  this.currentSyncToken = resp.syncData.nextSyncToken;
  
  var saveData = this.data || {
    currentSyncToken: this.currentSyncToken,
    content: {
      assets: [],
      entries: []
    }
  };
  
  resp.syncData.entries.forEach(function(entry) {
    var formatted = helpers.formatEntry(entry, resp.contentTypesData, resp.spaceData);
    saveData.content.entries.push(formatted);
  });
  
  resp.syncData.assets.forEach(function(asset) {
    var formatted = helpers.formatAsset(asset, resp.contentTypesData, resp.spaceData);
    saveData.content.assets.push(formatted);
  });
  
  // remove deleted from entries
  if (resp.syncData.deletedEntries) {
    resp.syncData.deletedEntries.forEach(function(deletedEntry) {
      saveData.content.entries.forEach(function(entry, index) {
        if (entry.id == deletedEntry.sys.id) saveData.content.entries.splice(index, 1);
      })
    })
  }
  
  // remove deleted from assets
  if (resp.syncData.deletedAssets) {
    resp.syncData.deletedAssets.forEach(function(deletedAsset) {
      saveData.content.assets.forEach(function(asset, index) {
        if (entry.id == deletedEntry.sys.id) saveData.content.entries.splice(index, 1);
      })
    })
  }
  
  // Save to local file
  this.saveLocal(saveData).catch(throwError);
  this.data = saveData;
  
  return saveData;
}

/*
  ContentfulPull.getFromFile
    Loads the datafile into memory
*/
ContentfulPull.prototype.getFromFile = function() {
  var _this = this;
  var d = Promise.defer();
  
  fs.readFile(this.settings.path, "utf8", function(err, resp) {
    if (err) d.reject(err);
    if (!err) {
      _this.data = JSON.parse(resp);
      _this.currentSyncToken = _this.data.currentSyncToken;
      d.resolve(_this.data.content);
    }
  })
  
  return d.promise;
}

/*
  ContentfulPull.get
    Returns a promise with the data in memory, from the web, or from the local store.
*/
ContentfulPull.prototype.get = function() {
  var _this = this;
  var d = Promise.defer();
  
  // If no data is in memory, get from file, if that's not existing, sync from contentful
  if (!this.data) {
    this.getFromFile().then(d.resolve).catch(function() {
      _this.sync().then(d.resolve);
    })
  }else{
    return new Promise(function(resolve, reject) {
      resolve(_this.data.content);
    })
  }
  
  return d.promise;
}

/*
  ContentfulSynchronize.saveLocal
    Saves the data to a local file
*/
ContentfulPull.prototype.saveLocal = function(data) {
  var d = Promise.defer();
  
  console.log("ContentfulPull | Saving to local file...");
  
  // Write to local storage
  fs.writeFile(this.settings.path, JSON.stringify(data), "utf8", function(err) {
    if (err) {
      console.log("ContentfulPull | An error occurred while saving local file.");
      d.reject();
    }
    if (!err) {
      console.log("ContentfulPull | File saved successfully.");
      d.resolve();
    }
  });
  
  return d.promise;
};

module.exports = ContentfulPull;