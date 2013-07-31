function Adapter(logger, config, callback) {
    
    var test = config.test;
    if(!test) throw new Error("No test object");
    
    test.equal(config.foo, 42, "Config object");
    
    logger.once("log", function(m) {
        test.ok(true, "Log event in adapter emited");
        test.ok(m, "Message object reviced");
        test.equal(m.message, "Test message", "Expected message");
        
        test.done();
    });
    
    process.nextTick(callback);
    
}

module.exports = Adapter;