package main

import (
	"flag"
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"github.com/VictoriaMetrics/grafana-datasource/pkg/buildinfo"
	"github.com/VictoriaMetrics/grafana-datasource/pkg/plugin"
)

func main() {
	flag.Parse()
	buildinfo.Init()
	backend.Logger.Info("Starting VictoriaMetrics datasource backend ...")

	if err := datasource.Manage("victoriametrics-datasource-http-backend", plugin.NewDatasource, datasource.ManageOpts{}); err != nil {
		log.DefaultLogger.Error("Failed to process VictoriaMetrics datasource backend :%s", err.Error())
		os.Exit(1)
	}
}
