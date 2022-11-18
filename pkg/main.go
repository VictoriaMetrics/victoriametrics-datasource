package main

import (
	"os"

	"github.com/VictoriaMetrics/grafana-datasource/pkg/plugin"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

func main() {
	backend.Logger.Info("Starting VictoriaMetrics datasource backend 123...")
	if err := datasource.Manage("victoriametrics-datasource-http-backend", plugin.NewDatasource, datasource.ManageOpts{}); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
