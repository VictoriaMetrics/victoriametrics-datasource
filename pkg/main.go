package main

import (
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"

	"github.com/VictoriaMetrics/victoriametrics-datasource/pkg/plugin"
)

// VM_PLUGIN_ID describes plugin name that matches Grafana plugin naming convention
const VM_PLUGIN_ID = "victoriametrics-metrics-datasource"

func main() {
	backend.SetupPluginEnvironment(VM_PLUGIN_ID)

	pluginLogger := log.New()
	mux := http.NewServeMux()
	ds := Init(mux)
	httpResourceHandler := httpadapter.New(mux)

	pluginLogger.Debug("Starting VM datasource")

	err := backend.Manage(VM_PLUGIN_ID, backend.ServeOpts{
		CallResourceHandler: httpResourceHandler,
		QueryDataHandler:    ds,
		CheckHealthHandler:  ds,
	})
	if err != nil {
		pluginLogger.Error("Error starting VM datasource", "error", err.Error())
	}
}

// Init initializes VM datasource plugin service
func Init(mux *http.ServeMux) *plugin.Datasource {
	ds := plugin.NewDatasource()

	mux.HandleFunc("/", ds.RootHandler)
	mux.HandleFunc("/api/v1/labels", ds.VMAPIQuery)
	mux.HandleFunc("/api/v1/query", ds.VMAPIQuery)
	mux.HandleFunc("/api/v1/series", ds.VMAPIQuery)
	mux.HandleFunc("/prettify-query", ds.VMAPIQuery)
	mux.HandleFunc("/expand-with-exprs", ds.VMAPIQuery)
	mux.HandleFunc("/api/v1/label/{key}/values", ds.VMAPIQuery)
	mux.HandleFunc("/vmui", ds.VMUIQuery)

	return ds
}
