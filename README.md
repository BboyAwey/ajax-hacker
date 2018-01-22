# ajax-hacker
Hack your ajax

Ajax-hacker supply a function that can hack ajax object(XMLHttpRequest, ActiveXObject and XDomainRequest), modify it and add hooks on it. Others who use ajax object will not even notice it.

> Actually I use it in a front-end performance monitoring project.

## Installation

```shell
npm install ajax-hacker --save
```

## Useage

You can import ajax-hacker in both AMD and CommonJS way

```js
var ajaxHacker = require('ajax-hacker')
```

Or you can just link ajax-hacker with a script tag, In this way, an Object called ajaxHacker have been insert into global object.

```html
<script src="./ajax-hacker.js"></script>
```

And you can use it like this below:

```js
ajaxHacker({
  responseType: 'json',
  timeout: 3000,
  withCredentials: false,
  onabord: function (e, next) {
    console.log('hacker onabord: ', e, this)
    next()
  },
  onerror: function (e, next) {
    console.log('hacker onerror: ', e, this)
    next()
  },
  onload: function (e, next) {
    console.log('hacker onload: ', e, this)
    next()
  },
  onloadend: function (e, next) {
    console.log('hacker onloadend: ', e, this)
    next()
  },
  onloadstart: function (e, next) {
    console.log('hacker onloadstart: ', e, this)
    next()
  },
  onprogress: function (e, next) {
    console.log('hacker progress ', e, this)
    next()
  },
  ontimeout: function (e, next) {
    console.log('hacker timeout ', e, this)
    next()
  },
  upload: {
    // except onreadystatechange, beforeOpen, beforeSend and beforeAbord, upload object support the same hooks as xhr object
    onprogress: function (e, next) {
      console.log('hacker upload onprogress', e)
      next()
    }
    // ...etc
  },
  onreadystatechange: function (e) {
    console.log('hacker readystatechange', e, this)
  },
  beforeOpen: function (next, method, url, async, user, password) {
    console.log('beforeOpen ', method, url)
    next()
  },
  beforeSend: function (next, body) {
    console.log('beforeSend ', body)
    next()
  },
  beforeAbord: function (next) {
    console.log('beforeAbord')
    next()
  }
}
```

Now your ajax object will follow your step like a lovely dog.
