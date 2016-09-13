const spawn = require('child_process').spawn;
const EventEmitter = require('events');


class Scanner extends EventEmitter {
    constructor(iface) {
        super();
        this._interface = iface || 'wlan0';
        this._accessPoints = {};
    }

    /**
     * _parse
     * 
     * This parses the text output of iwlist and places it
     * int a JSON structure.
     * 
     * @param {any} data
     * 
     * @memberOf Scanner
     */
    _parse(data) {
        var lines = data.split("\n");
        var inAP = false;
        var isWPA2 = false;
        var reAP = /^\s*Cell\s+\d+\s+-\s+Address:\s+([A-F\d:]{17})/;
        var reChannel = /^\s*Channel:(\d+)/;
        var reFrequency = /^\s*Frequency:(\d+(?:\.\d+)?)\s+GHz/;
        var reESSID = /^\s*ESSID:"?([^"]+)"?/;
        var reQuality = /^\s*Quality=(\d+)\/70\s+Signal\s+level=([-+]?\d+)\s+dBm/;
        var reBitRate = /(\d+(?:\.\d+)?)\s+Mb\/s/g;
        var reEncryption = /^\s*Encryption\s+key:on/;
        var reWPA2 = /^\s*IE:\s+IEEE\s+802\.11i\/WPA2\s+Version\s+(\d+)/;
        var reWPA2_GroupCipher = /^\s*Group\s+Cipher\s+:\s*(\w+)/;
        var reWPA2_PairwiseCipher = /^\s*Pairwise\s+Ciphers\s+\((\d+)\)\s+:\s*(\w+)/;
        var reWPA2_AuthenticationSuite = /^\s*Authentication\s+Suites\s+\((\d+)\)\s+:\s*(\w+)/;
        this._accessPoints = {};

        var ap = null;

        for (var l of lines) {
            if (reAP.test(l) == true) {
                if (inAP == true) {
                    // see if the previous access point exists already
                    // only replace it if this has better link quality
                    if (true == ap.essid in this._accessPoints) {
                        if (ap.linkQuality > this._accessPoints[ap.essid].linkQuality) {
                            this._accessPoints[ap.essid] = ap;
                        }
                    } else {
                        if (ap.essid == null) {
                            this._accessPoints[ap.address] = ap;
                        } else {
                        this._accessPoints[ap.essid] = ap;
                        }
                    }
                    this.emit('data', ap);
                }
                inAP = true;
                isWPA2 = false;
                ap = {
                    address: reAP.exec(l)[1],
                    bitRates: [],
                    encryption: false
                };
            } else if (inAP == true) {
                var brGroups;

                while ((brGroups = reBitRate.exec(l)) != null) {
                    ap.bitRates.push(parseFloat(brGroups[1]));
                }

                if (reChannel.test(l) == true) {
                    ap.channel = parseInt(reChannel.exec(l)[1]);
                } else if (reFrequency.test(l) == true) {
                    ap.frequency = parseFloat(reFrequency.exec(l)[1]) * 1e9;
                } else if (reESSID.test(l) == true) {
                    ap.essid = reESSID.exec(l)[1];
                    if (ap.essid == '\\x00') {
                        ap.essid = null;
                        ap.essid_hidden = true;
                    } else {
                        ap.essid_hidden = false;
                    }
                } else if (reQuality.test(l) == true) {
                    var groups = reQuality.exec(l);
                    ap.linkQuality = parseFloat(groups[1]) / 70.0;
                    ap.level = parseFloat(groups[2]);
                } else if (reEncryption.test(l) == true) {
                    ap.encryption = true;
                } else if (reWPA2.test(l) == true) {
                    isWPA2 = true;
                    ap.wpa2 = {
                        version: reWPA2.exec(l)[1]
                    };
                } else if ((isWPA2 == true) && (reWPA2_GroupCipher.test(l) == true)) {
                    ap.wpa2.groupCipher = reWPA2_GroupCipher.exec(l)[1];
                } else if ((isWPA2 == true) && (reWPA2_PairwiseCipher.test(l) == true)) {
                    var groups = reWPA2_PairwiseCipher.exec(l);
                    if (false == 'pairwiseCipher' in ap.wpa2) {
                        ap.wpa2.pairwiseCipher = {};
                    }
                    ap.wpa2.pairwiseCipher[groups[1]] = groups[2];
                } else if ((isWPA2 == true) && (reWPA2_AuthenticationSuite.test(l) == true)) {
                    var groups = reWPA2_AuthenticationSuite.exec(l);
                    if (false == 'authenticationSuite' in ap.wpa2) {
                        ap.wpa2.authenticationSuite = {};
                    }
                    ap.wpa2.authenticationSuite[groups[1]] = groups[2];
                }
            }
        }
        if (inAP == true) {
            // see if the previous access point exists already
            // only replace it if this has better link quality
            if (true == ap.essid in this._accessPoints) {
                if (ap.linkQuality > this._accessPoints[ap.essid].linkQuality) {
                    this._accessPoints[ap.essid] = ap;
                }
            } else {
                if (ap.essid == null) {
                    this._accessPoints[ap.address] = ap;
                } else {
                this._accessPoints[ap.essid] = ap;
                }
            }
            this.emit('data', ap);
        }
        
        this.emit('scan_complete', this._accessPoints);
    }

    startScan() {
        var errorString = "";
        var scanResults = "";
        var scanner = spawn('iwlist', [this._interface, 'scanning']);
        scanner.stdout.on('data', (data) => { scanResults += data.toString(); });
        scanner.stderr.on('data', (data) => { errorString += data.toString(); });
        scanner.on('close', (function(code) {
            if (code == 0) {
                this._parse(scanResults);
            } else {
                console.log('ERROR:', errorString);
            }
        }).bind(this));
    }
}

module.exports = Scanner;
