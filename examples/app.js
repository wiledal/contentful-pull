var ContentfulPull = require("../"),
    http = require("http"),
    fs = require("fs");

var content = new ContentfulPull({
  path: __dirname + "/local.json",
  space: "hpa660ogqyfa",
  accessToken: "56829e5230afd110f6ec9d96ba7b2be632ce391af637b5533bb522ae1e397273"
});

// Express-like server in 22 lines:
function xpress() {
  var server = http.createServer(handleRequest);
  var middlewares = [];
  
  function parseTemplate(html, options) {
    var re = /<%([^%>]+)?%>/g, reExp = /(^( )?(if|for|else|switch|case|break|{|}))(.*)?/g, code = 'var r=[];\n', cursor = 0, match;
    var add = function(line, js) {
        js? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        return add;
    }
    while(match = re.exec(html)) {
        add(html.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(html.substr(cursor, html.length - cursor));
    code += 'return r.join("");';
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
  }
  
  function handleRequest(req, res) {
    var index = -1;
    res.render = function(template, data) {
      fs.readFile(template, "utf8", function(err, html) {
        res.end(parseTemplate(html, data));
      });
    };
    function n() {
      index++;
      middlewares[index](req,res,n);
    }
    n();
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

var app = xpress();

// Database middleware
app.use(function(req, res, next) {
  content.get({
    resolveLinks: true
  }).then(function(response) {
    res.db = response;
    next();
  }).catch(function(err) {
    console.log(err.stack);
  });
})

// Route middleware
app.use(function(req, res, next) {
  if (req.url.match(/\/sync\/?/gi)) {
    // route /sync, syncs the database. this can be hooked up to a webhook from contentful
    // to keep the data on the server up to date
    content.sync().then(function(resp) {
      res.end("Synced database, now " + resp.entries.length + " entries in database");
    });
  }else if (req.url.match(/\/?/gi)) {
    // just a simple route to show the entries
    var entries = res.db.entries.filter(function(entry) {
      if (entry.type == "Post") return true;
      return false;
    })
    
    console.log(entries[0].fields);
    res.render("index.html", {entries: entries});
  }
})

console.log("xpress running on 4000");
app.listen(4000);