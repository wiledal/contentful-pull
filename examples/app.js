var ContentfulPull = require("../"),
    http = require("http");

var content = new ContentfulPull({
  path: __dirname + "/local.json",
  space: "hpa660ogqyfa",
  accessToken: "56829e5230afd110f6ec9d96ba7b2be632ce391af637b5533bb522ae1e397273"
});


// The lightest weight express-like thing
function basicServer() {
  var server = http.createServer(handleRequest);
  var middlewares = [];
  
  function handleRequest(req, res) {
    var index = -1;
    function next() {
      index++;
      middlewares[index](req,res,next);
    }
    next();
  }
  
  return {
    use: function(fn) {
      middlewares.push(fn);
    },
    listen: function(port) {
      server.listen(port);
    }
  }
}

var app = basicServer();

// Database middleware
app.use(function(req, res, next) {
  content.get().then(function(response) {
    res.db = response;
    next();
  });
})

// Route middleware
app.use(function(req, res, next) {
  if (req.url.match(/\/sync\/?/gi)) {
    // route /sync, syncs the database. this can be hooked up to a webhook from contentful
    // to keep the data on the server up to date
    content.sync().then(function(resp) {
      res.end("Synced database, now " + resp.entries.length + " entries in database");
    })
  }else if (req.url.match(/\/?/gi)) {
    // just a simple route to show the entries
    res.end("Got " + res.db.entries.length + " entries in the database!");
  }
})

app.listen(4000);