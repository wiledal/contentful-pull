# contentful-pull

### usage:
```js
var ContentfulPull = require("contentful-pull");

var content = new ContentfulPull({
  path: __dirname + "/local.json",
  space: "space_id",
  accessToken: "access_token"
});

// Get, gets all data from local storage, syncs if no local storage is available
// Use this pretty much always
content.get().then(function(response) {
  console.log(response.entries);
})

// Sync, syncs with the server, appends or removes accordingly
// Use with a contentful webhook to keep your data up to date at all times
content.sync().then(function(response) {
  console.log(response.entries);
})
```