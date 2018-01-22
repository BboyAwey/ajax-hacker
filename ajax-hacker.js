(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    // AMD
    define(factory)
  } else if (typeof exports === "object") {
    // CommonJS
    module.exports = factory()
  } else {
    // global or window
    root.ajaxHacker = factory()
  }
}(this, function () {
  function isFunc (f) {
    return f && typeof f === "function"
  }

  function setReadOnlyPropsFromXhr (hajax, xhr) {
    var props = {
      UNSENT: 0,
      OPENED: 1,
      HEADERS__RECEIVED: 2,
      LOADING: 3,
      DONE: 4,
      readyState: null,
      status: 0,
      statusText: "",
      response: "",
      responseText: "",
      responseURL: "",
      responseXML: null
    }
    for (var key in props) {
      hajax[key] = props[key]
      if (xhr) {
        try {
          hajax[key] = xhr[key]
        } catch (e) {}
      }
    }
  }

  function addEventProps (xhr, isUpload) {
    xhr.onabort = null
    xhr.onerror = null
    xhr.onload = null
    xhr.onloadend = null
    xhr.onloadstart = null
    xhr.onprogress = null
    xhr.ontimeout = null
    if (!isUpload) xhr.onreadystatechange = null
    xhr.__events = {
      abort: [],
      error: [],
      load: [],
      loadend: [],
      loadstart: [],
      progress: [],
      timeout: [],
      readystatechange: []
    }
    if (!isUpload) xhr.__events.onreadystatechange = []
  }

  function initBaseEvent (_this) {
    for (var key in _this.__events) {
      _this.__events[key][0] = function () {
        setReadOnlyPropsFromXhr(_this, _this.__xhr)
      }
    }
  }

  function handleEvent (_this, type, config, isUpload) {
    var ardType = type.substring(2) // addEventListener/removeEventListener/dispatchEvent
    return function () {
      var __arguments = arguments
      var args = []
      var next = function () {
        // trigger ardType
        for (var i = 1; i < _this.__events[ardType].length; i++) {
          if (isFunc(_this.__events[ardType][i])) _this.__events[ardType][i].apply(_this.__xhr, args)
        }
        // trigger onType
        if (isFunc(_this[type])) {
          _this[type].apply(_this.__xhr, __arguments) // give xhr back when calling events
        }
      }
      // first trigger base event to change hajax status
      _this.__events[ardType][0].apply(_this.__xhr, args)

      for (var i = 0; i < arguments.length; i++) {
        args.push(arguments[i])
      }
      if (isFunc(config[type])) {
        args.push(next)
        config[type].apply(_this.__xhr, args)
      } else {
        next()
      }
    }
  }

  function handleMethod (_this, type, args, next) {
    var _args = []
    for (var i = 0; i < args.length; i++) {
      _args.push(args[i])
    }
    _args.unshift(next)
    if (isFunc(_this.__config[type])) {
      _this.__config[type].apply(_this.__xhr, _args)
      // _this.__config[type].apply(_this, _args)
    } else {
      next()
    }
  }

  function Event () {}
  Event.prototype.addEventListener = function (type, listener, useCapture) {
    // this.__xhr.addEventListener(type, listener, useCapture)
    this.__events[type].push(listener)
  }
  Event.prototype.removeEventListener = function (type, listener, useCapture) {
    var evts = this.__events[type]
    for (var i = 0; i < evts.length; i++) {
      if (evts[i] !== listener) {
        evts.splice(i, 1)
      }
    }
  }
  Event.prototype.dispatchEvent = function (event) {
    this.__xhr.dispatchEvent(event)
  }

  function Hajax (xhr, config) {
    this.__config = config
    this.__xhr = xhr
    // props
    setReadOnlyPropsFromXhr(this)
    this.responseType = "" // r&w
    this.timeout = 0 // r&w
    this.withCredentials = false // r&w
    // events props
    addEventProps(this)
    initBaseEvent(this)
    // upload prop
    this.__upload = xhr.upload
    this.upload = new Event()
    this.upload.__xhr = this.__xhr
    addEventProps(this.upload, true)
    initBaseEvent(this.upload)
  }

  // methods
  Hajax.prototype = new Event()
  Hajax.prototype.open = function (method, url, async, user, password) {
    var _this = this
    handleMethod(_this, "beforeOpen", arguments, function () {
      _this.__xhr.open(method, url, async, user, password)
      setReadOnlyPropsFromXhr(_this, _this.__xhr)
    })
  }
  Hajax.prototype.send = function (body) {
    var that = this
    handleMethod(that, "beforeSend", arguments, function () {
      // set readable/writable props
      that.__xhr.responseType = that.__config.responseType || ""
      that.__xhr.timeout = that.__config.timeout || that.timeout
      that.__xhr.withCredentials = that.__config.withCredentials || that.withCredentials
      var key
      // set events
      for (key in that.__xhr) {
        if (/^on/g.test(key)) {
          that.__xhr[key] = handleEvent(that, key, that.__config || {})
        }
      }
      for (key in that.__upload) {
        if (/^on/g.test(key)) {
          that.__upload[key] = handleEvent(that.upload, key, that.__config.upload || {}, true)
        }
      }
      that.__xhr.send(body)
      setReadOnlyPropsFromXhr(that, that.__xhr)
    })
  }
  Hajax.prototype.abort = function () {
    var _this = this
    handleMethod(_this, "beforeAbord", arguments, function () {
      _this.__xhr.abort()
      setReadOnlyPropsFromXhr(_this, _this.__xhr)
    })
  }

  Hajax.prototype.setRequestHeader = function (name, value) {
    this.__xhr.setRequestHeader(name, value)
  }
  Hajax.prototype.getAllResponseHeaders = function () {
    this.__xhr.getAllResponseHeaders()
  }
  Hajax.prototype.overrideMimeType = function (mime) {
    this.__xhr.overrideMimeType(mime)
  }
  Hajax.prototype.getResponseHeader = function () {
    this.__xhr.getResponseHeader(name)
  }

  return function (config) {
    // XMLHttpRequest, ActiveXObject and XDomainRequest
    if (window.__XHRAlreadyModified) return false
    var XHRConstructor
    if (window.XMLHttpRequest) {
      XHRConstructor = window.XMLHttpRequest
      window.XMLHttpRequest = function (whatever) {
        return new Hajax(new XHRConstructor(), config || {})
      }
    }
    if (window.ActiveXObject) {
      XHRConstructor = window.ActiveXObject
      window.ActiveXObject = function (type) {
        if (type === "Microsoft.XMLHTTP") {
          return new Hajax(new XHRConstructor(), config || {})
        } else {
          return XHRConstructor(type)
        }
      }
    }
    if (window.XDomainRequest) {
      XHRConstructor = window.XDomainRequest
      window.XDomainRequest = function (whatever) {
        return new Hajax(new XHRConstructor(), config || {})
      }
    }
    window.__XHRAlreadyModified = true
  }
}))
