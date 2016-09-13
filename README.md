# node-linux-wifi
Node libraries for handling WiFi on Linux

## Configuration
This library execs various network utilities directly. Since it is not a good
idea to run node applications as root, you ought to give some permissions to
the user/group that will be using this library.

```
$ # Allows the netdev group to read and write the wpa_supplicant config file
$ sudo chown root:netdev /etc/wpa_supplicant/wpa_supplicant.conf
$ sudo chmod g+rw /etc/wpa_supplicant/wpa_supplicant
$ # Allows people with net administrator capabilities to use iwlist, ifconfig, ifup and ifdown
$ setcap cap_net_admin=eip /sbin/iwlist /sbin/ifconfig /sbin/ifup /sbin/ifdown
```

## Usage

### Scanning
```
const WiFi = require('node-linux-wifi');
var wifi = new WiFi();

wifi.on('scan_complete', (access_points) => {
    console.log(access_points);
}

wifi.Scan();
```

Should generate something like:
```
{
    "Big-Corp": {
        "address": "88:F0:31:72:28:E4",
        "bitRates": [
            1,
            2,
            5.5,
            6,
            9,
            11,
            12,
            18,
            24,
            36,
            48,
            54
        ],
        "encryption": true,
        "channel": 6,
        "frequency": 2437000000,
        "linkQuality": 0.9857142857142858,
        "level": -41,
        "essid": "AmesburyTruth-Corp",
        "essid_hidden": false,
        "wpa2": {
            "version": "1",
            "groupCipher": "CCMP",
            "pairwiseCipher": {
                "1": "CCMP"
            },
            "authenticationSuite": {
                "1": "PSK"
            }
        }
    },
    "Big-Corp-DB": {
        "address": "88:F0:31:72:28:E2",
        "bitRates": [
            1,
            2,
            5.5,
            6,
            9,
            11,
            12,
            18,
            24,
            36,
            48,
            54
        ],
        "encryption": true,
        "channel": 6,
        "frequency": 2437000000,
        "linkQuality": 0.9714285714285714,
        "level": -42,
        "essid": "IQMS",
        "essid_hidden": false,
        "wpa2": {
            "version": "1",
            "groupCipher": "CCMP",
            "pairwiseCipher": {
                "1": "CCMP"
            },
            "authenticationSuite": {
                "1": "PSK"
            }
        }
    },
    "Big-Corp-WEP": {
        "address": "88:F0:31:72:28:E0",
        "bitRates": [
            1,
            2,
            5.5,
            6,
            9,
            11,
            12,
            18,
            24,
            36,
            48,
            54
        ],
        "encryption": true,
        "channel": 6,
        "frequency": 2437000000,
        "linkQuality": 0.9857142857142858,
        "level": -41,
        "essid": "Amesbury-Corp",
        "essid_hidden": false
    },
    "NETGEAR": {
        "address": "00:14:6C:D8:94:0C",
        "bitRates": [
            1,
            2,
            5.5,
            11,
            18,
            24,
            36,
            54,
            6,
            9,
            12,
            48
        ],
        "encryption": true,
        "channel": 11,
        "frequency": 2462000000,
        "linkQuality": 0.7714285714285715,
        "level": -56,
        "essid": "NETGEAR",
        "essid_hidden": false
    },
    "88:F0:31:72:18:C5": {
        "address": "88:F0:31:72:18:C5",
        "bitRates": [
            1,
            2,
            5.5,
            6,
            9,
            11,
            12,
            18,
            24,
            36,
            48,
            54
        ],
        "encryption": true,
        "channel": 6,
        "frequency": 2437000000,
        "linkQuality": 0.45714285714285713,
        "level": -78,
        "essid": null,
        "essid_hidden": true
    }
}

```

### Reading and Writing the WiFi Configuration

Right now the configuration file must be ```/etc/wpa_supplicant/wpa_supplicant.conf```
```
const WiFi = require('node-linux-wifi');
var wifi = new WiFi();

wifi.Config.getNetworks((error, config) => {
    if (!error) {
        console.log(config);
    }
});

wifi.Config.addNetwork({
    ssid: 'MyTopSecretSSID',
    psk: WiFi.calculateWpaKey('MySuperSecretPassword')
}, (error) => {
    if (!error) {
        console.log('Success');
    }
});

wifi.Config.removeNetwork('MyLameOpenSSID', (error) => {
    if (!error) {
        console.log('Success');
    }
});
```

### Changing the WiFi Country
The country code is a [ISO 3166-1 alpha 2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code. 
```
const WiFi = require('node-linux-wifi');
var wifi = new WiFi();

wifi.Config.getNetworks((error, config) => {
    if (!error) {
        config.country = 'US';
        wifi.Config.writeConfig(config);
    }
});
```
