package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"github.com/VictoriaMetrics/victoriametrics-datasource/pkg/plugin"
)

func main() {
	backend.Logger.Info("Starting VictoriaMetrics datasource backend ...")

	if err := datasource.Manage("victoriametrics-datasource-http-backend", plugin.NewDatasource, datasource.ManageOpts{}); err != nil {
		log.DefaultLogger.Error("Failed to process VictoriaMetrics datasource backend :%s", err.Error())
		os.Exit(1)
	}
}
