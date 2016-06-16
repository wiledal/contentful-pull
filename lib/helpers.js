var helpers = {
  // Return the content type
  getContentType: function(entry, contentTypes, space) {
    var result = contentTypes.items.filter(function (contentType) {
      return contentType.sys.id === entry.sys.contentType.sys.id;
    });
    return result[0].name;
  },

  /*
    formatField
      Traverses the field and returns a formatted version
  */
  formatField: function(field) {
    // If the field is null, return it immediately
    if (!field) return field;

    // If a field is an array, traverse inception-style
    if (Array.isArray(field)) {
      return field.map(function(f2) {
        return helpers.formatField(f2);
      })
    }

    // If a field is a link, return it like this
    if (field.sys && field.sys.type == "Link") {
      return {
        type: field.sys.linkType.toLowerCase(),
        id: field.sys.id
      }
    }

    // Otherwise it's probably a string, so return it normally
    return field;
  },

  formatAsset: function(asset) {
    var data = {
      id: asset.sys.id,
      fields: {}
    }

    for (var i in asset.fields) {
      var fieldName = i;
      var field = asset.fields[i];

      data.fields[fieldName] = helpers.formatField(field);
    }

    return data;
  },

  /*
    formatEntry
      Returns a formatted entry
  */
  formatEntry: function(entry, contentTypes, space) {
    var data = {
      id: entry.sys.id,
      type: helpers.getContentType(entry, contentTypes, space),
      fields: {}
    }

    // Go through the fields and format them nicer
    for (var i in entry.fields) {
      var field = entry.fields[i];
      var fieldName = i;

      var langs = {};

      // For each language, format the field
      for (var lang in field) {
        langs[lang] = helpers.formatField(field[lang]);
      }

      data.fields[fieldName] = langs;
    }

    return data;
  }
}

module.exports = helpers;
