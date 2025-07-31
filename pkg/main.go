package main

import (
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"github.com/VictoriaMetrics/victoriametrics-datasource/pkg/plugin"
)

// VM_PLUGIN_ID describes plugin name that matches Grafana plugin naming convention
const VM_PLUGIN_ID = "victoriametrics-metrics-datasource"

func main() {
	backend.SetupPluginEnvironment(VM_PLUGIN_ID)

	pluginLogger := log.New()
	ds := plugin.NewDatasource()

	pluginLogger.Info("Starting VM datasource")

	err := backend.Manage(VM_PLUGIN_ID, backend.ServeOpts{
		CallResourceHandler: ds,
		QueryDataHandler:    ds,
		CheckHealthHandler:  ds,
	})
	if err != nil {
		pluginLogger.Error("Error starting VM datasource", "error", err.Error())
	}
}
