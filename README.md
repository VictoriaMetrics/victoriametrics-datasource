# VictoriaMetrics data source for Grafana
The VictoriaMetrics data source plugin allows you to query and visualize VictoriaMetrics
data from within Grafana.

## Installation

For detailed instructions on how to install the plugin on Grafana Cloud or
locally, please checkout the [Plugin installation docs](https://grafana.com/docs/grafana/latest/plugins/installation/).

### Dev release installation

Installing dev version of grafana plugin requires:
1. to change `grafana.ini` config to allow loading unsigned plugins:
``` ini
[plugins]
allow_loading_unsigned_plugins = victoriametrics-datasource
```
Grafana docs can be found [here](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins)
2. To download plugin build and move contents into grafana plugins directory:

``` bash
curl -L https://github.com/VictoriaMetrics/grafana-datasource/releases/download/v0.1.1/victoriametrics-datasource-v0.1.1.zip -o /var/lib/grafana/plugins/plugin.zip
unzip -d /var/lib/grafana/plugins/ /var/lib/grafana/plugins/plugin.zip
rm /var/lib/grafana/plugins/plugin.zip
```
3. Restart Grafana

#### Install in Kubernetes

Example with Grafana [helm chart](https://github.com/grafana/helm-charts/blob/main/charts/grafana/README.md):

``` yaml
extraInitContainers:
  - name: "load-vm-ds-plugin"
    image: "curlimages/curl:7.85.0"
    command: [ "/bin/sh" ]
    workingDir: "/var/lib/grafana/plugins"
    securityContext:
      runAsUser: 0
    args:
     - "-c"
     - |
       set -ex
       mkdir -p /var/lib/grafana/plugins/
       curl -L https://github.com/VictoriaMetrics/grafana-datasource/releases/download/v0.1.1/victoriametrics-datasource-v0.1.1.zip -o /var/lib/grafana/plugins/plugin.zip
       unzip -d /var/lib/grafana/plugins/ /var/lib/grafana/plugins/plugin.zip
       rm /var/lib/grafana/plugins/plugin.zip
       chown -R 472:472 /var/lib/grafana/plugins/
    volumeMounts:
      - name: storage
        mountPath: /var/lib/grafana
```

This example uses init container to download and install plugin.
Another option would be to build custom Grafana image with plugin based on same installation instructions.

## Getting started development

### 1. Configure Grafana
Installing dev version of grafana plugin requires to change `grafana.ini` config to allow loading unsigned plugins:
``` ini
# Directory where grafana will automatically scan and look for plugins
plugins = {{path to directory with plugin}}
```
``` ini
[plugins]
allow_loading_unsigned_plugins = victoriametrics-datasource
```
### 2. Run the plugin
In the project directory, you can run:
```
# install dependencies
yarn install

# run the app in the development mode
yarn dev

# build the plugin for production to the `dist` folder and zip build
yarn build:zip
```

## Learn more

- [Configure Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/)
- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System

## License

This project is licensed under the [AGPL-3.0-only](LICENSE).
