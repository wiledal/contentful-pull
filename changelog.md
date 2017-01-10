# contentful-pull changelog

#### v0.2.9
  - Now using normal functions instead of arrow-functions for backwards
    compatibility

#### v0.2.8
  - Changed to `new Promise` notation to fix deprecation errors on newer node

#### v0.2.7
  - Fixed parsing of arrays when resolving links

#### v0.2.6
  - Fixed issue with parsing empty fields

#### v0.2.5
  - Missed passing options to data transformation, causing broken link resolving from .sync

#### v0.2.4
  - If a resolved link is not available, due to publish settings or otherwise, do not include it

#### v0.2.3
  - Fixed resolveLinks for arrays

#### v0.2.2
  - Errors when saving now show in console

#### v0.2.1
  - Some small improvements to the syncing-method
  - Updated example

#### v0.2.0
  - `.get`, `.sync` now has a "resolveLinks"-option which resolves entry and asset links
  - Provide `{raw: true}` in `sync` or `get` methods to get the raw data from contentful
  - Now saving data as it comes from Contentful and processing it upon `.get`
  - Sync now works with updates

#### v0.1.0
  - `.get`, `.sync`
  - Saves to file and reformats data to a workable format
  - Basic example usage

---
