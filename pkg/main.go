package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
)

func main() {
	backend.Logger.Info("Starting VictoriaMetrics datasource backend...\n")
	var servOpt datasource.ServeOpts
	err := datasource.Serve(servOpt)

	if err != nil {
		backend.Logger.Error(err.Error())
		os.Exit(1)
	}
}
