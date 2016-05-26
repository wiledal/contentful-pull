# contentful-pull

### What?
This class utilizes the sync-method of the Contentful API to fetch data, save a local copy in plain .json for further use, and store in application memory for quick access.  
  
Use with small to medium datasets of non-sensitive data. 

### Usage:
```js
var ContentfulPull = require("contentful-pull");

var content = new ContentfulPull({
  // Where to store the local .json-file
  path: __dirname + "/local.json",
  
  // Contentful space and accessToken
  space: "space_id",
  accessToken: "access_token"
});

// Get, gets all data from local storage, syncs if no local storage is available
// Use this pretty much always
// Great for use in a middleware before your routes
content.get().then(function(response) {
  console.log(response.entries);
  console.log(response.assets);
})

// Sync, syncs with the server, appends or removes accordingly
// Use with a contentful webhook to keep your data up to date at all times
content.sync().then(function(response) {
  console.log(response.entries);
  console.log(response.assets);
})
```

See examples for a use-case scenario.

### License
(MIT License)  
Copyright (c) 2016 Hugo Wiledal

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.