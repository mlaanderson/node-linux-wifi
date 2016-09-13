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
     * @param {any} config
     * @param {any} callback
     * 
     * @memberOf Network
     */
    writeConfig(config, callback) {
        fs.mkdtemp('/tmp/wifi-', (errMkdTemp, folder) => {
            if (errMkdTemp) {
                callback(errMkdTemp);
            } else {
                var reHexPSK = /^[0-9a-f]{64}$/;
                var sout = fs.createWriteStream(folder + '/wpa_supplicant.conf');
                for (var key in config) {
                    if (key != 'networks') {
                        sout.write(key + "=" + config[key] + "\n");
                    }
                }
                for (var ssid in config.networks) {
                    sout.write("network={\n");
                    sout.write("        ssid=\"" + ssid + "\"\n");
                    if (reHexPSK.test(config.networks[ssid].psk) == false) {
                        // calculate the hex psk
                        var buff = Crypto.pbkdf2Sync(config.networks[ssid].psk, ssid, 4096, 256, 'sha1');
                        config.networks[ssid].psk = "";
                        for (var n = 0; n < 32; n++) {
                            var code = buff[n].toString(16);
                            if (code.length < 2) code = "0" + code;
                            config.networks[ssid].psk += code;
                        }
                    }
                    sout.write("        psk=" + config.networks[ssid].psk + "\n");
                    sout.write("}\n");
                }
                sout.end();
                ChildProcess.exec('sudo cp ' + folder + 
                    '/wpa_supplicant.conf /etc/wpa_supplicant/wpa_supplicant.conf', 
                    (errCopy, stdout, stderr) => {
                    if (errCopy) {
                        callback(errCopy);
                    } else {
                        callback(null, config);
                    }
                    fs.unlink(folder + '/wpa_supplicant.conf', () => {
                        fs.rmdir(folder, () => {});
                    });
                });
            }
        });
    }

    /**
     * Reads /etc/wpa_supplicant/wpa_supplicant.conf, parses it and
     * returns a representative structure.
     * 
     * @param {any} callback
     * 
     * @memberOf Network
     */
    getNetworks(callback) {
        callback = callback || function() {};
        ChildProcess.exec('sudo cat /etc/wpa_supplicant/wpa_supplicant.conf', (error, stdout, stderr) => {
            if (error) {
                callback(error);
                this._config = {};
            } else {
                var lines = stdout.split("\n");
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
     * @param {any} network
     * @param {any} callback
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
                this.writeConfig(config, callback);
            }
        }).bind(this));
    }

    /**
     * Removes a network from the list in /etc/wpa_supplicant/wpa_supplicant.conf
     * 
     * @param {any} ssid
     * @param {any} callback
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
                    this.writeConfig(config, callback);
                }
            }
        }).bind(this));
    }
}

module.exports = Network;