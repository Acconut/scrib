function FailAdapter(logger, config, callback) {
    
    process.nextTick(function() {
        callback(new Error("Ohh no"));
    });
}

module.exports = FailAdapter;