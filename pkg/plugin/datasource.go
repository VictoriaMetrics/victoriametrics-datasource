package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

const (
	defaultScrapeInterval = 15 * time.Second
	health                = "/-/healthy"
	// it is weird logic to pass an identifier for an alert request in the headers
	// but Grafana decided to do so, so we need to follow this
	requestFromAlert = "FromAlert"
)

// NewDatasource creates a new datasource instance.
func NewDatasource(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	opts, err := settings.HTTPClientOptions(ctx)
	if err != nil {
		return nil, fmt.Errorf("http client options: %w", err)
	}
	opts.ForwardHTTPHeaders = true

	cl, err := httpclient.New(opts)
	if err != nil {
		return nil, fmt.Errorf("httpclient new: %w", err)
	}
	return &Datasource{
		settings:   settings,
		httpClient: cl,
	}, nil
}

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
	settings backend.DataSourceInstanceSettings

	httpClient *http.Client
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
	d.httpClient.CloseIdleConnections()
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()
	headers := req.Headers

	forAlerting, err := d.checkAlertingRequest(headers)
	if err != nil {
		return nil, err
	}

	var wg sync.WaitGroup
	for _, q := range req.Queries {
		wg.Add(1)
		go func(q backend.DataQuery, forAlerting bool) {
			defer wg.Done()
			response.Responses[q.RefID] = d.query(ctx, q, forAlerting)
		}(q, forAlerting)
	}
	wg.Wait()

	return response, nil
}

// query process backend.Query and return response
func (d *Datasource) query(ctx context.Context, query backend.DataQuery, forAlerting bool) backend.DataResponse {
	var q Query
	if err := json.Unmarshal(query.JSON, &q); err != nil {
		err = fmt.Errorf("failed to parse query json: %s", err)
		return newResponseError(err, backend.StatusBadRequest)
	}

	q.TimeRange = TimeRange(query.TimeRange)
	q.MaxDataPoints = query.MaxDataPoints
	minInterval, err := q.calculateMinInterval()
	if err != nil {
		err = fmt.Errorf("failed to calculate minimal interval: %w", err)
		return newResponseError(err, backend.StatusBadRequest)
	}

	var settings struct {
		HTTPMethod  string `json:"httpMethod"`
		QueryParams string `json:"customQueryParameters"`
	}
	if err := json.Unmarshal(d.settings.JSONData, &settings); err != nil {
		err = fmt.Errorf("failed to parse datasource settings: %w", err)
		return newResponseError(err, backend.StatusBadRequest)
	}
	if settings.HTTPMethod == "" {
		settings.HTTPMethod = http.MethodPost
	}

	reqURL, err := q.getQueryURL(minInterval, d.settings.URL, settings.QueryParams)
	if err != nil {
		err = fmt.Errorf("failed to create request URL: %w", err)
		return newResponseError(err, backend.StatusBadRequest)
	}

	req, err := http.NewRequestWithContext(ctx, settings.HTTPMethod, reqURL, nil)
	if err != nil {
		err = fmt.Errorf("failed to create new request with context: %w", err)
		return newResponseError(err, backend.StatusBadRequest)
	}
	resp, err := d.httpClient.Do(req)
	if err != nil {
		if !isTrivialError(err) {
			// Return unexpected error to the caller.
			return newResponseError(err, backend.StatusBadRequest)
		}

		// Something in the middle between client and datasource might be closing
		// the connection. So we do a one more attempt in hope request will succeed.
		req, err = http.NewRequestWithContext(ctx, settings.HTTPMethod, reqURL, nil)
		if err != nil {
			err = fmt.Errorf("failed to create new request with context: %w", err)
			return newResponseError(err, backend.StatusBadRequest)
		}
		resp, err = d.httpClient.Do(req)
		if err != nil {
			err = fmt.Errorf("failed to make http request: %w", err)
			return newResponseError(err, backend.StatusBadRequest)
		}
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.DefaultLogger.Error("failed to close response body", "err", err.Error())
		}
	}()

	if resp.StatusCode != http.StatusOK {
		err = fmt.Errorf("got unexpected response status code: %d with request url: %q", resp.StatusCode, reqURL)
		return newResponseError(err, backend.Status(resp.StatusCode))
	}

	var r Response
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		err = fmt.Errorf("failed to decode body response: %w", err)
		return newResponseError(err, backend.StatusInternal)
	}

	r.ForAlerting = forAlerting

	frames, err := r.getDataFrames()
	if err != nil {
		err = fmt.Errorf("failed to prepare data from response: %w", err)
		return newResponseError(err, backend.StatusInternal)
	}
	for i := range frames {
		q.addMetadataToMultiFrame(frames[i])
	}

	return backend.DataResponse{Frames: frames}
}

// CheckHealth performs a request to the specified data source and returns an error if the HTTP handler did not return
// a 200 OK response.
func (d *Datasource) CheckHealth(ctx context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	endpoint := d.settings.URL
	idx := strings.Index(endpoint, "/select/")
	if idx > 0 {
		endpoint = fmt.Sprintf("%s%s", endpoint[:idx], health)
	} else {
		endpoint = fmt.Sprintf("%s%s", strings.TrimRight(endpoint, "/"), health)
	}
	r, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return newHealthCheckErrorf("could not create request"), nil
	}
	resp, err := d.httpClient.Do(r)
	if err != nil {
		return newHealthCheckErrorf("request error"), nil
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.DefaultLogger.Error("check health: failed to close response body", "err", err.Error())
		}
	}()
	if resp.StatusCode != http.StatusOK {
		return newHealthCheckErrorf("got response code %d", resp.StatusCode), nil
	}
	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}

func (d *Datasource) checkAlertingRequest(headers map[string]string) (bool, error) {
	var forAlerting bool
	if val, ok := headers[requestFromAlert]; ok {
		if val == "" {
			return false, nil
		}

		boolValue, err := strconv.ParseBool(val)
		if err != nil {
			return false, fmt.Errorf("failed to parse %s header value: %s", requestFromAlert, val)
		}

		forAlerting = boolValue
	}
	return forAlerting, nil
}

// newHealthCheckErrorf returns a new *backend.CheckHealthResult with its status set to backend.HealthStatusError
// and the specified message, which is formatted with Sprintf.
func newHealthCheckErrorf(format string, args ...interface{}) *backend.CheckHealthResult {
	return &backend.CheckHealthResult{Status: backend.HealthStatusError, Message: fmt.Sprintf(format, args...)}
}

// newHealthCheckErrorf returns a new backend.DataResponse with its status set to backend.DataResponse
// and the specified error message.
func newResponseError(err error, httpStatus backend.Status) backend.DataResponse {
	log.DefaultLogger.Error(err.Error())
	return backend.DataResponse{Status: httpStatus, Error: err}
}

// isTrivialError returns true if the err is temporary and can be retried.
func isTrivialError(err error) bool {
	if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
		return true
	}
	// Suppress trivial network errors, which could occur at remote side.
	s := err.Error()
	if strings.Contains(s, "broken pipe") || strings.Contains(s, "reset by peer") {
		return true
	}
	return false
}
