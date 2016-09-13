const WiFi = require('.');

var wifi = new WiFi("wlan0");

wifi.getInterfaces((error, list) => {
    if (error) {
        console.log("ERROR getting interface list:", error);
    } else {
        console.log("Wireless Interfaces:");
        for (var iface of list) {
            console.log("\t" + iface);
        }
    }
});



wifi.on('scan_complete', (aps) => {
    console.log("");
    console.log("Access Points:");
    for (var name in aps) {
        console.log("\t" + name, (100 * aps[name].linkQuality).toFixed(1) + "%", aps[name].level + " dBm");
    }
});

wifi.Scan();
