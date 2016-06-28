var ContentfulPull = require("../"),
    http = require("http"),
    fs = require("fs");

var content = new ContentfulPull({
  path: __dirname + "/local.json",
  space: "hpa660ogqyfa",
  accessToken: "56829e5230afd110f6ec9d96ba7b2be632ce391af637b5533bb522ae1e397273"
});

var server = http.createServer(function(req, res) {
  if (req.url == "/") {
    content.get({resolveLinks: true}).then(function(data) {
      var assets = data.assets;
      var entries = data.entries;

      var entryTypes = [];
      entries.forEach(function(entry) {
        if (entryTypes.indexOf(entry.type) == -1) entryTypes.push(entry.type);
      });

      // TEST
      entries.forEach( function(entry) {
        if (entry.type == "TestContentType") {
          for (var i in entry.fields) {
            var field = entry.fields[i];

            console.log(field);
          }
        }
      });

      res.end(`
<html>
<body>
<pre>
You have ${entries.length} entries and ${assets.length} assets in your space.
Entry types: ${entryTypes.join(", ")}

To sync your new content, go to <a href="/sync">/sync</a>
<pre>
</body>
`);
    })
  }else if (req.url.match(/\/sync/gi)) {
    content.sync().then(function() {
      res.end(`
        Synced!
      `);
    });
  }
});
server.listen(4000);
