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
ver=$(curl -s https://api.github.com/repos/VictoriaMetrics/grafana-datasource/releases/latest | grep -oP '\Kv\d+\.\d+\.\d+' | head -1)
curl -L https://github.com/VictoriaMetrics/grafana-datasource/releases/download/$ver/victoriametrics-datasource-$ver.tar.gz -o /var/lib/grafana/plugins/plugin.tar.gz
tar -xf /var/lib/grafana/plugins/plugin.tar.gz -C /var/lib/grafana/plugins/
rm /var/lib/grafana/plugins/plugin.tar.gz
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
       ver=$(curl -s https://api.github.com/repos/VictoriaMetrics/grafana-datasource/releases/latest | grep -oP '\Kv\d+\.\d+\.\d+' | head -1)
       curl -L https://github.com/VictoriaMetrics/grafana-datasource/releases/download/$ver/victoriametrics-datasource-$ver.tar.gz -o /var/lib/grafana/plugins/plugin.tar.gz
       tar -xf /var/lib/grafana/plugins/plugin.tar.gz -C /var/lib/grafana/plugins/
       rm /var/lib/grafana/plugins/plugin.tar.gz
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

### 3. How to build backend plugin

From the root folder of the project run the following command:
```
make victoriametrics-backend-plugin-build
```
This command will build executable multi-platform files to the `dist` folder for the following platforms:
* linux/amd64
* linux/arm64
* linux/arm
* linux/386
* amd64
* arm64

### 4.How to build frontend plugin
From the root folder of the project run the following command:
```
make victorimetrics-frontend-plugin-build
```
This command will build all frontend app into `dist` folder.

### 5. How to build frontend and backend parts of the plugin:
When frontend and backend parts of the plugin is required, run the following command from 
the root folder of the project:
```
make victoriametrics-datasource-plugin-build
```
This command will build frontend part and backend part or the plugin and locate both 
parts into `dist` folder. 

## How to make new release

0. Make sure there are no open security issues.
1. Create a release tag:
    * `git tag -s v1.xx.y` in `master` branch
2. Run `TAG=v1.xx.y make build-release` to build and package binaries in `*.tar.gz` release archives.
3. Run `git push origin v1.xx.y` to push the tag created `v1.xx.y` at step 2 to public GitHub repository
4. Go to <https://github.com/VictoriaMetrics/grafana-datasource/releases> and verify that draft release with the name `TAG` has been created
   and this release contains all the needed binaries and checksums.
5. Remove the `draft` checkbox for the `TAG` release and manually publish it.

## Learn more

- [Configure Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/)
- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System

## License

This project is licensed under the [AGPL-3.0-only](LICENSE).
