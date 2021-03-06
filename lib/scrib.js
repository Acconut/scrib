var EventEmitter = require("events").EventEmitter,
    path = require("path"),
    async = require("async"),
    errno = require("errno").errno;

/**
 * Initalizes a new logger
 *
 * @param {Array|Object} adapters Array containing adapters to load or object with adapters as keys and options as values
 * @param {Function} callback Callback function
 */
function Scrib(adapters, callback) {
    
    EventEmitter.call(this);
    
    // Convert array to object
    if(Array.isArray(adapters)) {
        var am = adapters;
        adapters = {};
        am.forEach(function(m) {
            adapters[m] = {};
        });
    }
    
    var all = [],
        self = this;
    for(var m in adapters) {
        try {
            var adapter;
            try {
                adapter = require("scrib-" + m);
            } catch(e) {
                adapter = require(path.join(path.dirname(module.parent.filename), m));
            }
            all.push(async.apply(adapter, self, adapters[m]));
        } catch(e) {
            return callback(e);
        }
    }
    
    async.parallel(all, function done(err) {
        callback(err);
    });
}

// Import propertis from EventEmitter
// If we inherit after we set the prototype it breaks!
require("util").inherits(Scrib, EventEmitter);

Scrib.prototype._registry = {};

Scrib.prototype.register = function(id, message, priority, category) {
    this._registry[id] = {
        message: message,
        priority: priority,
        category: category
    };
};

Scrib.prototype.put = function(message, data, priority, id, category) {
    this._log(new Message(
        message, data, priority, id, category
    ));
};

/**
 * 
 */
Scrib.prototype.log = function(id, data) {
    if(!(id in this._registry)) throw new Error("Unkown message with id '" + id + "'");
    
    var i = this._registry[id],
        m = new Message(
            i.message,
            data,
            i.priority,
            id,
            i.category
        );
    
    this._log(m);

};

Scrib.prototype._log = function(m) {
    this.emit("log", m);
    if(m.id) this.emit("id:" + m.id, m);
    if(m.category) this.emit("category:" + m.category, m);
};

Scrib.prototype.catch = function(e, data, priority, id, category) {
    
    // It should be an error object
    if(!(e instanceof Error)) e = new Error(e);
    
    data = data || {};
    data.stack = e.stack;
    id = id || e.name;
    message = e.message;
    
    // Is this an error from libuv
    if(e.errno && e.errno in errno) {
        var uverr = errno[e.errno];
        
        id = uverr.code;
        message = uverr.description;
        data.errno = e.errno;
        
        delete e.code;
        delete e.errno;
        
        for(var p in e) {
            data[p] = e[p];
        }
    }
    
    this.put(
        message,
        data,
        priority,
        id,
        category
    );
       
};

function Message(message, data, priority, id, category) {
    
    // Default values
    this.message  = message  || "";
    this.data     = data     || {};
    this.priority = priority || 0;
    this.id       = id       || null;
    this.category = category || null;
    this.time     = Date.now();
    
}

module.exports = Scrib;