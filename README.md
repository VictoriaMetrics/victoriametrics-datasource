# VictoriaMetrics data source for Grafana
The VictoriaMetrics data source plugin allows you to query and visualize VictoriaMetrics
data from within Grafana.

## Installation

For detailed instructions on how to install the plugin on Grafana Cloud or
locally, please checkout the [Plugin installation docs](https://grafana.com/docs/grafana/latest/plugins/installation/).

## Getting started

### Configure Grafana

1. Set development mode
   (<i>Temporary setting. [Read more about Sign a plugin](https://grafana.com/docs/grafana/latest/developers/plugins/sign-a-plugin/)</i>)
   ```
   app_mode = development
   ```
2. Directory grafana plugins
   <br/>
   - Move plugin to default directory grafana plugins
   <br/>or
   - Configure directory where Grafana automatically scans and looks for plugins
<br/>

[Read more about configure grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/)

----

A data source backend plugin consists of both frontend and backend components.

### Frontend

1. Install dependencies

   ```bash
   yarn install
   ```

2. Build plugin in development mode or run in watch mode

   ```bash
   yarn dev
   ```

   or

   ```bash
   yarn watch
   ```

3. Build plugin in production mode

   ```bash
   yarn build
   ```


## Learn more

- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System
