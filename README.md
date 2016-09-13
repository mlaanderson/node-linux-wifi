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
