var Scrib = require("../"),
    EE = require("events").EventEmitter,
    fs = require("fs"),
    Test = module.exports,
    logger = null;
    
Test.setup = function(test) {
    logger = new Scrib({
        "./adapter.js": {
            foo: 42,
            test: test
        }
    }, function(e) {
        
        test.expect(7);
        
        test.ifError(e);
        test.ok(logger instanceof Scrib, "`logger` is a Scrib object");
        test.ok(logger instanceof EE, "`logger` inherits from EventEmitter");
        
        logger.put("Test message");
        
    });
};

Test.failSetup = function(test) {
    var faillogger = new Scrib(
        ["./failAdapter.js"]
    , function(e) {
        
        test.expect(1);
        
        test.ok(e instanceof Error, "Error argument");
        
        test.done();
        
    });
};

Test.put = function(test) {
    
    test.expect(7);
    
    logger.once("log", function(m) {
        
        test.ok(m, "Message object exists");
        test.equal(m.message, "Message", "Message");
        test.equal(m.data.bar, true, "Data");
        test.equal(m.priority, 3, "Priority");
        test.equal(m.id, "TEST_MSG", "ID");
        test.equal(m.category, "Tests", "Category");
        test.equal(Math.round(m.time / 10000), Math.round(Date.now() / 10000), "Time");
        
        test.done();
    });
    
    logger.put("Message", { bar: true }, 3, "TEST_MSG", "Tests");
    
};

Test.register = function(test) {
    
    test.expect(8);
    
    logger.once("log", function(m) {
        
        test.ok(m, "Message object exists");
        test.equal(m.message, "Message", "Message");
        test.equal(m.data.bar, true, "Data");
        test.equal(m.priority, 3, "Priority");
        test.equal(m.id, "TEST_MSG", "ID");
        test.equal(m.category, "Tests", "Category");
        test.equal(Math.round(m.time / 10000), Math.round(Date.now() / 10000), "Time");
        
        test.done();
    });
    
    logger.register("TEST_MSG", "Message", 3, "Tests");
    
    test.ok("TEST_MSG" in logger._registry);
    
    logger.log("TEST_MSG", { bar: true });
};

Test.events = function(test) {
    
    var calls = 0,
        done = function() {
            calls++;
            if(calls === 2) test.done();
        };
    
    test.expect(2);
    
    logger.once("id:TEST_MSG", function(m) {
        test.equal(m.id, "TEST_MSG", "ID");
        done();
    });
    
    logger.once("category:Tests", function(m) {
        test.equal(m.category, "Tests", "Category");
        done();
    });
    
    logger.log("TEST_MSG");
};

Test.catch = {
    
    error: function(test) {
        
        test.expect(4);
        
        logger.once("log", function(m) {
            
            test.equal(m.message, "Catch me", "Message");
            test.equal(m.id, "Error", "ID");
            test.equal(m.data.node, "up", "Data");
            test.ok(m.data.stack.indexOf(__filename) > -1, "Stack");
            
            test.done();
        });
        
        try {
            throw new Error("Catch me");
        } catch(e) {
            logger.catch(e, { node: "up" });
        }
        
    },
    
    noError: function(test) {
        
        test.expect(3);
        
        logger.once("log", function(m) {
            
            test.equal(m.message, "Catch me", "Message");
            test.equal(m.id, "Error", "ID");
            test.ok(m.data.stack.indexOf(__filename) > -1, "Stack");
            
            test.done();
        });
        
        try {
            throw "Catch me";
        } catch(e) {
            logger.catch(e);
        }
    },
    
    libuv: function(test) {
        
        logger.once("log", function(m) {
            
            test.equal(m.id, "ENOENT", "ID");
            test.equal(m.message, "no such file or directory", "Message");
            test.equal(m.data.errno, 34, "Error number");
            test.equal(m.data.syscall, "open", "Data from error object");
            test.equal(m.data.data, "yes", "Additional data");
            
            test.done();
            
        });
        
        try {
            fs.readFileSync("./sdfuufduhvudshf");
        } catch(e) {
            logger.catch(e, { data: "yes" });
        }
        
    }
    
};