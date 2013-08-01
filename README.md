Scrib
=====

A logger utlity for Node.js using adapters.

Scrib itself is just an event emitter with some fancy methods. The real wok is done by its adapters. When you initialize Scrib, you load one or more adapters for it. When you tell Scrib to log something, it's going to tell every adapter about your log and they'll handle it in their way e.g. send an e-mail or write to a log file.

For Scrib everything is a message. Every error, warning or log is a message.
Each message has following properties:

* `message`:  A short message describing itself
* `data = {}`: Optional data (e.g. API response) 
* `priority = 0`: The message's importance as a number equal or greater than 0
* `id = null`: An ID to specify the message. Useful for errors
* `category = null`: A category to group messages (e.g. Database)
* `time = Date.now()`: The timestamp when we logged

Example
---

```
npm install scrib
```

```javascript

var Scrib = require("Scrib"),
    logger = new Scrib({
        "local": {
            file: "./log.txt"
        },
        function(e) {
            
            // If during Scrib's startup an error appeared we should stop the process
            if(e) throw e;
            
            logger.put("Hello World");
        });

```

This example loads the [local-adapter](https://github.com/Acconut/scrib-local) for Scrib. After Scrib finished loading it's going to call the callback.

Adapters
---

* [`scrib-local`](https://github.com/Acconut/scrib-local): Write logs into log files

When you want to write one yourself, have a look at [this](https://github.com/Acconut/scrib/wiki/Writing-own-adapters).

API
---

#### `new Scrib(adapters, callback)`
Initalizes a new logger. `adapters` is a object where each key is an adapter's name and the value is an config object which is going to be passed into the adapter.
Scrib first tries to require `scrib-{ADAPTER}` and then the file directly ([see the code](https://github.com/Acconut/scrib/blob/master/lib/scrib.js#L29-L33)).
`callback` is a callback where the first argument is an error.

```javascript
new Scrib({
    // Will require scrib-local
    "local": {},
    
    // Wll require ./adapter.js
    "./adapter.js": {},
    function(e) {}
);
```


#### `Scrib.put(message, data, priority, id, category)`

The simplest way to log something:

```javascript
logger.put("API limit reached", { limit: 5000 }, 10, "API_LIMIT", "API");
```

#### `Scrib.register(id, message, priority, category)`
#### `Scrib.log(id, data)`

If we don't want to call `Scrib.put` each time using priority, category and message, we can simply register a message and then log it using `Scrib.log` and the ID:

```javascript
logger.register("API_LIMIT", "API limit reached", 10, "API");
logger.log("API_LIMIT", { limit: 5000 });
```

#### `Scrib.catch(error, data)`

This transforms an `Error` object into a message and then logs it:
```javascript
try {
    throw new Error("Ups");
} catch(e) 
    logger.catch(e);
}
```

If `e` is an error thrown by libuv, Scrib will trun it into a message: message is `e.description`, id is `e.code`, data.errno is `e.errno`.
Additional data from `e` is merged into data ([see code](https://github.com/Acconut/scrib/blob/master/lib/scrib.js#L102-L115)).

### Events

Scrib inherits from `EventEmitter` and has its functions.

* `log`: Emitted for each log
* `id:ID`: Emitted for each log if it's ID is `ID`, e.g. `id:API_TIMEOUT`
* `category:CATEGORY`: Emitted for each log if it's category is `category`, e.g. `category:API`

### Testing [![Build Status](https://drone.io/github.com/Acconut/scrib/status.png)](https://drone.io/github.com/Acconut/scrib/latest)

```
git clone git://github.com/Acconut/scrib.git
cd scrib
npm install
npm test
```

Licensed under [the MIT License](https://raw.github.com/Acconut/scrib/master/LICENSE).