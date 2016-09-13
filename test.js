const WiFi = require('.');
const assert = require('assert');

var wifi = new WiFi("wlan0");

wifi.getInterfaces((error, list) => {
    if (error) {
        assert(false, "ERROR getting interface list: " + error);
    } else {
        assert(true);
    }
});

assert('b240ad1394bbd481562186567f027ae107b33512d5e96a9ec8a7823e7178a6e3' == WiFi.calculateWpaKey('Hello', 'World'), 
    "ERROR: PSK keys are not being calculated correctly");


wifi.on('scan_complete', (aps) => {
    assert(true);
});

wifi.Scan();
