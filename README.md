# VictoriaMetrics data source for Grafana
The VictoriaMetrics data source plugin allows you to query and visualize VictoriaMetrics
data from within Grafana.

* [Motivation](#motivation)
* [Installation](#installation)
* [Configure the Datasource with Provisioning](#configure-the-datasource-with-provisioning)
* [Getting started development](#configure-the-datasource-with-provisioning)
* [How to make new release](#how-to-make-new-release)
* [How to use WITH templates](#how-to-use-with-templates)
* [Learn more](#learn-more)
* [License](#license)

## Motivation

VictoriaMetrics always recommended using [Prometheus datasource](https://docs.victoriametrics.com/#grafana-setup)
in Grafana. With time, Prometheus and VictoriaMetrics diverge more and more. So we decided to create a datasource plugin
specifically for VictoriaMetrics. The benefits of using VictoriaMetrics plugin are the following:

* Plugin fixes [label names validation](https://github.com/grafana/grafana/issues/42615) issue;
* [MetricsQL](https://docs.victoriametrics.com/MetricsQL.html) functions support;
* Allows redirecting query execution from Grafana to [vmui](https://docs.victoriametrics.com/#vmui);
* Supports [query tracing](https://docs.victoriametrics.com/Single-server-VictoriaMetrics.html#query-tracing) 
in Explore mode or right in panel's expressions.

We plan to add support of [WITH expressions](https://play.victoriametrics.com/select/accounting/1/6a716b0f-38bc-4856-90ce-448fd713e3fe/expand-with-exprs?query=WITH+%28%0D%0A++++cpuSeconds+%3D+node_cpu_seconds_total%7Binstance%3D%7E%22%24node%3A%24port%22%2Cjob%3D%7E%22%24job%22%7D%2C%0D%0A++++cpuCount+%3D+count%28count%28cpuSeconds%29+by+%28cpu%29%29%2C%0D%0A++++cpuIdle+%3D+sum%28rate%28cpuSeconds%7Bmode%3D%27idle%27%7D%5B5m%5D%29%29%0D%0A%29%0D%0A%28%28cpuCount+-+cpuIdle%29+*+100%29+%2F+cpuCount%0D%0A)
and auto queries formatting in the future.

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
ver=$(curl -s https://api.github.com/repos/VictoriaMetrics/grafana-datasource/releases/latest | grep -oE 'v\d+\.\d+\.\d+' | head -1)
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
       ver=$(curl -s https://api.github.com/repos/VictoriaMetrics/grafana-datasource/releases/latest | grep -oE 'v\d+\.\d+\.\d+' | head -1)
       curl -L https://github.com/VictoriaMetrics/grafana-datasource/releases/download/$ver/victoriametrics-datasource-$ver.tar.gz -o /var/lib/grafana/plugins/plugin.tar.gz
       tar -xf /var/lib/grafana/plugins/plugin.tar.gz -C /var/lib/grafana/plugins/
       rm /var/lib/grafana/plugins/plugin.tar.gz
       chown -R 472:472 /var/lib/grafana/plugins/
    volumeMounts:
      - name: storage
        mountPath: /var/lib/grafana
```

This example uses init container to download and install plugin. To allow Grafana using this container as a sidecar
set the following config:
```yaml
sidecar:
  datasources:
    initDatasources: true
    enabled: true
```
See more about chart settings [here](https://github.com/grafana/helm-charts/blob/541d97051de87a309362e02d08741ffc868cfcd6/charts/grafana/values.yaml)

Another option would be to build custom Grafana image with plugin based on same installation instructions.

## Configure the Datasource with Provisioning

Provision of grafana plugin requires to create datasource config file. 
If you need more additional information about settings of the datasource 
or you want to know how it works you can check [official provisioning doc](http://docs.grafana.org/administration/provisioning/#datasources).
Some settings and security params are similar for different datasources.

Provisioning datasource example file:

```yaml
apiVersion: 1

# List of data sources to insert/update depending on what's
# available in the database.
datasources:
   # <string, required> Name of the VictoriaMetrics datasource 
   # displayed in grafana panels and queries.
   - name: VictoriaMetrics
      # <string, required> Sets the data source type.
     type: victoriametrics-datasource
      # <string, required> Sets the access mode, either
      # proxy or direct (Server or Browser in the UI).
      # Some data sources are incompatible with any setting
      # but proxy (Server).
     access: proxy
     # <string> Sets default URL of the single node version of VictoriaMetrics
     url: http://victoriametrics:8428
     # <string> Sets the pre-selected datasource for new panels. 
     # You can set only one default data source per organization.
     isDefault: true

     # <string, required> Name of the VictoriaMetrics datasource 
     # displayed in grafana panels and queries.
   - name: VictoriaMetrics - cluster
     # <string, required> Sets the data source type.
     type: victoriametrics-datasource
     # <string, required> Sets the access mode, either
     # proxy or direct (Server or Browser in the UI).
     # Some data sources are incompatible with any setting
     # but proxy (Server).
     access: proxy
     # <string> Sets default URL of the cluster version of VictoriaMetrics
     url: http://vmselect:8481/select/0/prometheus
     # <string> Sets the pre-selected datasource for new panels. 
     # You can set only one default data source per organization.
     isDefault: false
```

You can check your configuration by doing the following steps:

1. Create folder `./provisioning/datasource` with datasource example file:

2. Download latest release:

``` bash
ver=$(curl -s https://api.github.com/repos/VictoriaMetrics/grafana-datasource/releases/latest | grep -oE 'v\d+\.\d+\.\d+' | head -1)
curl -L https://github.com/VictoriaMetrics/grafana-datasource/releases/download/$ver/victoriametrics-datasource-$ver.tar.gz -o plugin.tar.gz
tar -xf plugin.tar.gz -C ./victoriametrics-datasource
rm plugin.tar.gz
```

3. Create docker-compose file:

```yaml
  version: '3.0'

  services:

     grafana:
        container_name: 'grafana-datasource'
        build:
           context: ./.config
           args:
              grafana_version: ${GRAFANA_VERSION:-9.1.2}
        ports:
           - 3000:3000/tcp
        volumes:
           - ./victoriametrics-datasource:/var/lib/grafana/plugins/grafana-datasource
           - ./provisioning:/etc/grafana/provisioning
```

4. Run docker-compose file: 

```
docker-compose -f docker-compose.yaml up
```

When grafana starts successfully datasources should be present on the datasources tab

<p>
  <img src="docs/assets/provision_datasources.png" width="800">
</p>

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

## How to use WITH templates

The `WITH` templates feature simplifies the construction and management of complex queries.
You can try this feature in the [WITH templates playground](https://play.victoriametrics.com/select/accounting/1/6a716b0f-38bc-4856-90ce-448fd713e3fe/expand-with-exprs).

The "WITH templates" section allows you to create expressions with templates that can be used in dashboards.

WITH expressions are stored in the datasource object. If the dashboard gets exported, the associated WITH templates will not be included in the resulting JSON (due to technical limitations) and need to be migrated separately.

### Defining WITH Expressions

1. Navigate to the dashboard where you want to add a template. *Note: templates are available within the dashboard scope.*
2. Click the `WITH templates` button.
3. Enter the expression in the input field. Once done, press the `Save` button to apply the changes. For example:
   ```
   commonFilters = {instance=~"$node:$port",job=~"$job"},
   
   # `cpuCount` is the number of CPUs on the node
   cpuCount = count(count(node_cpu_seconds_total{commonFilters}) by (cpu)),
   
   # `cpuIdle` is the sum of idle CPU cores
   cpuIdle = sum(rate(node_cpu_seconds_total{mode='idle',commonFilters}[5m]))
   ```

   You can specify a comment before the variable and use markdown in it. The comment will be displayed as a hint during auto-completion. The comment can span multiple lines.

### Using WITH Expressions

1. After saving the template, you can enter it into the query editor field:
   ```
   ((cpuCount - cpuIdle) * 100) / cpuCount
   ```
   
   Thus, the entire query will look as follows:
    
   ```
   WITH (
    commonFilters = {instance=~"$node:$port",job=~"$job"},
    cpuCount = count(count(node_cpu_seconds_total{commonFilters}) by (cpu)),
    cpuIdle = sum(rate(node_cpu_seconds_total{mode='idle',commonFilters}[5m]))
   )
   ((cpuCount - cpuIdle) * 100) / cpuCount
   ```
   To view the raw query in the interface, enable the `Raw` toggle.

## Learn more

- [Configure Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/)
- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System

## License

This project is licensed under the [AGPL-3.0-only](LICENSE).
