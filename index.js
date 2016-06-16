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

  var d = Promise.defer();

  var client = contentful.createClient({
    space: this.settings.space,
    accessToken: this.settings.accessToken
  })

  var isInitial = this.currentSyncToken ? false : true;

  var spacePromise = client.getSpace();
  var contentTypesPromise = client.getContentTypes();
  var syncPromise = client.sync({initial: isInitial, resolveLinks: false, nextSyncToken: this.currentSyncToken});

  Promise.all([spacePromise, contentTypesPromise, syncPromise]).then(function(result) {
    var handledData = _this.handleSyncResponse({
      space: result[0],
      contentTypes: result[1],
      sync: result[2]
    });

    d.resolve(_this.transformData(handledData));
  });

  return d.promise;
};

/*
  ContentfulSynchronize.handleResponse
    Handles the response from Contentful
*/
ContentfulPull.prototype.handleSyncResponse = function(resp) {
  var _this = this;
  this.currentSyncToken = resp.sync.nextSyncToken;

  if (!this.data) this.data = resp;

  // If there are updates, replace current with new
  if (resp.sync.entries) {
    var syncIDs = _this.data.sync.entries.map(function(e) { return e.sys.id });
    resp.sync.entries.forEach(function(entry) {
      var existID = syncIDs.indexOf(entry.sys.id);
      if (existID > -1) {
        _this.data.sync.entries[existID] = entry;
      }else{
        _this.data.sync.entries.push(entry);
      }
    })
  }

  if (resp.sync.assets) {
    var syncIDs = _this.data.sync.assets.map(function(e) { return e.sys.id })
    resp.sync.assets.forEach(function(asset) {
      var existID = syncIDs.indexOf(asset.sys.id);
      if (existID > -1) {
        _this.data.sync.assets[existID] = asset;
      }else{
        _this.data.sync.assets.push(asset);
      }
    })
  }

  // remove deleted from entries
  if (resp.sync.deletedEntries) {
    resp.sync.deletedEntries.forEach(function(deletedEntry) {
      _this.data.sync.entries.forEach(function(entry, index) {
        if (entry.sys.id == deletedEntry.sys.id) _this.data.sync.entries.splice(index, 1);
      })
    })
  }

  // remove deleted from assets
  if (resp.sync.deletedAssets) {
    resp.sync.deletedAssets.forEach(function(deletedAsset) {
      _this.data.sync.assets.forEach(function(asset, index) {
        if (asset.sys.id == deletedAsset.sys.id) _this.data.sync.assets.splice(index, 1);
      })
    })
  }

  // Save to local file
  this.saveLocal(_this.data).catch(throwError);
  return this.data;
}

ContentfulPull.prototype.resolveLink = function (field, entries, assets) {
  var lookArray = entries;
  if (field.type == "asset") {
    lookArray = assets;
  }
  var referenced = lookArray.filter(function(e) {
    if (e.id === field.id) return true;
    return false;
  });
  return referenced[0];
};
/*
  transformData
    Transforms the data to preferred format before usage
*/
ContentfulPull.prototype.transformData = function(data, options) {
  var self = this;

  // If RAW data is requested, return basic object
  if (!options) options = {};
  if (options.raw) return data;

  // Else continue to make workable data
  var transformedData = {
    assets: [],
    entries: []
  };

  data.sync.entries.forEach(function(entry) {
    var formatted = helpers.formatEntry(entry, data.contentTypes, data.space);
    transformedData.entries.push(formatted);
  });

  data.sync.assets.forEach(function(asset) {
    var formatted = helpers.formatAsset(asset, data.contentTypes, data.space);
    transformedData.assets.push(formatted);
  });

  // Resolves the links
  if (options.resolveLinks) {
    for (var i = 0; i < transformedData.entries.length; i++) {
      // For each entry
      var entry = transformedData.entries[i];

      for (var key in entry.fields) {
        // Go through each field
        var field = entry.fields[key];

        for (var lang in field) {
          // And go through each language
          var fieldContent = field[lang];

          if (fieldContent instanceof Object) {
            if (fieldContent instanceof Array) {
              var links = [];
              fieldContent.forEach(function(c) {
                var link = self.resolveLink(c, transformedData.entries, transformedData.assets);
                if (link) links.push(link);
              });
              field[lang] = links;
            }else{
              var link = self.resolveLink(fieldContent, transformedData.entries, transformedData.assets);
              field[lang] = link ? link : null;
            }
          }
        }
      }
    }
  }

  return transformedData;
}

/*
  ContentfulPull.getFromFile
    Loads the datafile into memory
*/
ContentfulPull.prototype.getFromFile = function(options) {
  var _this = this;
  var d = Promise.defer();

  fs.readFile(this.settings.path, "utf8", function(err, resp) {
    if (err) d.reject(err);
    if (!err) {
      _this.data = JSON.parse(resp);
      _this.currentSyncToken = _this.data.sync.currentSyncToken;
      d.resolve(_this.transformData(_this.data, options));
    }
  })

  return d.promise;
}

/*
  ContentfulPull.get
    Returns a promise with the data in memory, from the web, or from the local store.
*/
ContentfulPull.prototype.get = function(options) {
  var _this = this;
  var d = Promise.defer();

  // If no data is in memory, get from file, if that's not existing, sync from contentful
  if (!this.data) {
    this.getFromFile(options).then(d.resolve).catch(function() {
      _this.sync(options).then(d.resolve);
    })
  }else{
    return new Promise(function(resolve, reject) {
      resolve(_this.transformData(_this.data, options));
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
      console.log(err.stack);
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
