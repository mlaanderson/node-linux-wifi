"use strict";

const EventEmitter = require('events');
const ChildProcess = require('child_process');
const Crypto = require('crypto');
const fs = require('fs');

class Network extends EventEmitter {
    constructor() {
        super();
    }

    /**
     * Writes a configuration to /etc/wpa_supplicant/wpa_supplicant.conf
     * 
     * @param {Object} config
     * 
     * @memberOf Network
     */
    writeConfig(config) {
        var reHexPSK = /^[0-9a-f]{64}$/;
        var sout = fs.createWriteStream('/etc/wpa_supplicant/wpa_supplicant.conf');
        for (var key in config) {
            if (key != 'networks') {
                sout.write(key + "=" + config[key] + "\n");
            }
        }
        for (var ssid in config.networks) {
            sout.write("network={\n");
            sout.write("\tssid=\"" + ssid + "\"\n");
            if (reHexPSK.test(config.networks[ssid].psk) == false) {
                // calculate the hex psk
                config.networks[ssid].psk = Network.calculateWpaKey(config.networks[ssid].psk);
            }
            sout.write("\tpsk=" + config.networks[ssid].psk + "\n");
            sout.write("}\n");
        }
        sout.end();
    }

    /**
     * Reads /etc/wpa_supplicant/wpa_supplicant.conf, parses it and
     * returns a representative structure.
     * 
     * @param {function(error, networkList)} callback
     * 
     * @memberOf Network
     */
    getNetworks(callback) {
        callback = callback || function() {};
        fs.readFile('/etc/wpa_supplicant/wpa_supplicant.conf', (error, data) => {
            if (error) {
                callback(error);
            } else {
                var lines = data.toString().split("\n");
                var inNet = false;
                var reNetwork = /^\s*network=\{/;
                var reSSID = /^\s*ssid="([^"]+)"/;
                var rePSK = /^\s*psk="?([^"]+)"?/;
                var reOther = /^\s*(\w+)=(.+)$/;
                var network = null;
                var result = {
                    networks: {}
                };

                for (var l of lines) {
                    if (reNetwork.test(l) == true) {
                        if (inNet == true) {
                            result.networks[network.ssid] = network;
                        }
                        inNet = true;
                        network = {};
                    } else if (inNet == true) {
                        if (reSSID.test(l) == true) {
                            network.ssid = reSSID.exec(l)[1];
                        } else if (rePSK.test(l) == true) {
                            network.psk = rePSK.exec(l)[1];
                        }
                    } else if (reOther.test(l) == true) {
                        var groups = reOther.exec(l);
                        result[groups[1]] = groups[2]; 
                    }
                }

                if (inNet == true) {
                    result.networks[network.ssid] = network;
                }
                callback(null, result);
            }
        });
    }

    /**
     * Adds a new network to the list in /etc/wpa_supplicant/wpa_supplicant.conf
     * 
     * @param {Object} network
     * @param {function(error)} callback
     * 
     * @memberOf Network
     */
    addNetwork(network, callback) {
        callback = callback || function() {};
        this.getNetworks((function(errGetNetworks, config) {
            if (errGetNetworks) {
                callback(errGetNetworks);
            } else {
                config.networks[network.ssid] = network;
                this.writeConfig(config);
                callback(null);
            }
        }).bind(this));
    }

    /**
     * Removes a network from the list in /etc/wpa_supplicant/wpa_supplicant.conf
     * 
     * @param {string} ssid
     * @param {function(error)} callback
     * 
     * @memberOf Network
     */
    removeNetwork(ssid, callback) {
        callback = callback || function() {};
        this.getNetworks((function(errGetNetworks, config) {
            if (errGetNetworks) {
                callback(errGetNetworks);
            } else {
                if (false == ssid in config.networks) {
                    callback("ERROR: " + ssid + " not found");
                } else {
                    delete config.networks[ssid];
                    this.writeConfig(config);
                    callback(null);
                }
            }
        }).bind(this));
    }
}


/**
 * Calculates the WPA key from a passphrase string
 * 
 * @param {string} passphrase
 * @returns
 * 
 * @memberOf Network
 */
Network.calculateWpaKey = function(ssid, passphrase) {
    // calculate the hex psk
    var buff = Crypto.pbkdf2Sync(passphrase, ssid, 4096, 256, 'sha1');
    var result = "";

    for (var n = 0; n < 32; n++) {
        var code = buff[n].toString(16);
        if (code.length < 2) code = "0" + code;
        result += code;
    }

    return result;
}


module.exports = Network;