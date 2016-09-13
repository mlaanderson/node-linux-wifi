const EventEmitter = require('events');
const ChildProcess = require('child_process');
const Scanner = require('./scanner.js');
const Network = require('./network.js');

class WiFi extends EventEmitter {
    /**
     * Creates an instance of WiFi.
     * 
     * @param {any} iface
     * 
     * @memberOf WiFi
     */
    constructor(iface) {
        super();
        if (iface) {
            this._interface = iface;
        } else {
            this.getInterfaces((error, interfaceList) => {
                if ((error) || (interfaceList.length <= 0)) {
                    this._interface = "wlan0";
                } else {
                    this._interface = interfaceList[0];
                }
            });
        }
    }

    /**
     * Scans for available Access Points
     * 
     * 
     * @memberOf WiFi
     */
    Scan() {
        var scanner = new Scanner(this._interface);
        scanner.on('scan_complete', (function(accessPoints) {
            this.emit('scan_complete', accessPoints);
        }).bind(this));
        scanner.startScan();
    }

    /**
     * Returns a list of all 802.11 interfaces
     * 
     * @param {function(error, interfaceList)} callback
     * 
     * @memberOf WiFi
     */
    getInterfaces(callback) {
        callback = callback || function() {};
        ChildProcess.exec('iwconfig', (error, stdout, stderr) => {
            if (error) {
                callback(error);
            } else {
                var lines = stdout.split("\n");
                var reWiFi = /^(\w+)\s+IEEE\s+802\.11/;
                var interfaceList = [];

                for (var l of lines) {
                    if (reWiFi.test(l) == true) {
                        interfaceList.push(reWiFi.exec(l)[1]);
                    }
                }
                callback(null, interfaceList);
            }
        });
    }

    get Config() {
        return new Network();
    }
}

module.exports = WiFi;