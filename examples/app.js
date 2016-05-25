var ContentfulPull = require("../");

var content = new ContentfulPull({
  path: __dirname + "/local.json",
  space: "hpa660ogqyfa",
  accessToken: "56829e5230afd110f6ec9d96ba7b2be632ce391af637b5533bb522ae1e397273"
});

content.sync().then(function(response) {
  console.log(response.entries.length);
})