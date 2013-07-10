# superagent-hawk

[superagent](http://visionmedia.github.io/superagent)
with
[hawk](https://github.com/hueniverse/hawk)

## Installation

Install with [component](http://component.io):

    $ component install CrowdProcess/superagent-hawk

And with [npm](http://npmjs.org):

    $ npm install superagent-hawk

## API

The normal [superagent](http://visionmedia.github.io/superagent) things,
plus `hawk`:

```js
var request = require('superagent-hawk');

var credential = {
  "id": "50e17602-f044-41cb-8e5f-ae634cc15fb0",
  "key": "I2Yiq3UGAUR6Oztnv/3JJK6T0clmGTX14d/TJ1qNKio=",
  "algorithm": "sha256"
}

request
  .get('http://resource.com')
  .hawk(credential)
  .end(function (res) {
    console.log(res.body);
  });
```

and `bewit`:

```js
var request = require('superagent-hawk');

var bewit = "ZDA1Mzg4Y2UtMGRmYi00NWFlLThlODMtY2Q2MmJlZGE0MDNlXDEzNzM0Njc3NDNcNnJyUjA3QWdOQkVWVHlENCsxOFZTZ2M1OERqWmxrc3VzVHZoOUpLM0JzQT1c";

request
  .get('http://resource.com')
  .bewit(bewit)
  .end(function (res) {
    console.log(res.body);
  });
```

## License

MIT
