package plugin

import (
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*DatasourceInstance)(nil)
)

const (
	defaultScrapeInterval = 15 * time.Second
	health                = "/-/healthy"
	// it is weird logic to pass an identifier for an alert request in the headers
	// but Grafana decided to do so, so we need to follow this
	requestFromAlert = "FromAlert"
)

// Datasource describes a plugin service that manages DatasourceInstance entities
type Datasource struct {
	im     instancemgmt.InstanceManager
	logger log.Logger
	backend.CallResourceHandler
}

// NewDatasource creates a new datasource instance.
func NewDatasource() *Datasource {
	var ds Datasource
	ds.im = datasource.NewInstanceManager(newDatasourceInstance)
	ds.logger = log.New()

	mux := http.NewServeMux()
	mux.HandleFunc("/", ds.RootHandler)
	mux.HandleFunc("/api/v1/labels", ds.VMAPIQuery)
	mux.HandleFunc("/api/v1/query", ds.VMAPIQuery)
	mux.HandleFunc("/api/v1/series", ds.VMAPIQuery)
	mux.HandleFunc("/prettify-query", ds.VMAPIQuery)
	mux.HandleFunc("/expand-with-exprs", ds.VMAPIQuery)
	mux.HandleFunc("/api/v1/label/{key}/values", ds.VMAPIQuery)
	mux.HandleFunc("/vmui", ds.VMUIQuery)
	ds.CallResourceHandler = httpadapter.New(mux)

	return &ds
}

// newDatasourceInstance returns an initialized VM datasource instance
func newDatasourceInstance(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	logger := log.New()
	logger.Debug("Initializing new data source instance")

	opts, err := settings.HTTPClientOptions(ctx)
	if err != nil {
		logger.Error("Error parsing VM settings", "error", err)
		return nil, err
	}
	opts.ForwardHTTPHeaders = true

	cl, err := httpclient.New(opts)
	if err != nil {
		logger.Error("error initializing HTTP client", "error", err)
		return nil, err
	}

	if settings.URL == "" {
		return nil, fmt.Errorf("url can't be blank")
	}
	if _, err := url.Parse(settings.URL); err != nil {
		return nil, fmt.Errorf("failed to parse datasource url: %w", err)
	}

	var dsOpts struct {
		QueryParams string `json:"customQueryParameters,omitempty"`
		VMUIURL     string `json:"vmuiUrl,omitempty"`
	}
	if err := json.Unmarshal(settings.JSONData, &dsOpts); err != nil {
		return nil, fmt.Errorf("failed to parse datasource settings: %w", err)
	}
	queryParams, err := url.ParseQuery(dsOpts.QueryParams)
	if err != nil {
		return nil, fmt.Errorf("failed to parse query params: %w", err)
	}
	if len(dsOpts.VMUIURL) == 0 {
		vmuiUrl, err := newURL(settings.URL, "/vmui/", false)
		if err != nil {
			return nil, fmt.Errorf("failed to build VMUI url: %w", err)
		}
		dsOpts.VMUIURL = vmuiUrl.String()
	}
	return &DatasourceInstance{
		url:         settings.URL,
		httpClient:  cl,
		logger:      logger,
		queryParams: queryParams,
		vmuiURL:     dsOpts.VMUIURL,
	}, nil
}

// DatasourceInstance is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type DatasourceInstance struct {
	url         string
	httpClient  *http.Client
	logger      log.Logger
	queryParams url.Values
	vmuiURL     string
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (di *DatasourceInstance) Dispose() {
	// Clean up datasource instance resources.
	di.httpClient.CloseIdleConnections()
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	response := backend.NewQueryDataResponse()
	headers := req.Headers

	di, err := d.getInstance(ctx, req.PluginContext)
	if err != nil {
		return nil, err
	}

	forAlerting, err := checkAlertingRequest(headers)
	if err != nil {
		return nil, err
	}

	var wg sync.WaitGroup
	for _, q := range req.Queries {
		wg.Add(1)
		go func(q backend.DataQuery, forAlerting bool) {
			defer wg.Done()
			response.Responses[q.RefID] = di.query(ctx, q, forAlerting)
		}(q, forAlerting)
	}
	wg.Wait()

	return response, nil
}

// query process backend.Query and return response
func (di *DatasourceInstance) query(ctx context.Context, query backend.DataQuery, forAlerting bool) backend.DataResponse {
	var q Query
	if err := json.Unmarshal(query.JSON, &q); err != nil {
		err = fmt.Errorf("failed to parse query json: %s", err)
		return newResponseError(err, backend.StatusBadRequest)
	}

	q.TimeRange = TimeRange(query.TimeRange)
	q.MaxDataPoints = query.MaxDataPoints

	reqURL, err := q.getQueryURL(di.url, di.queryParams)
	if err != nil {
		err = fmt.Errorf("failed to create request URL: %w", err)
		return newResponseError(err, backend.StatusBadRequest)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, nil)
	if err != nil {
		err = fmt.Errorf("failed to create new request with context: %w", err)
		return newResponseError(err, backend.StatusBadRequest)
	}
	resp, err := di.httpClient.Do(req)
	if err != nil {
		if !isTrivialError(err) {
			// Return unexpected error to the caller.
			return newResponseError(err, backend.StatusBadRequest)
		}

		// Something in the middle between client and datasource might be closing
		// the connection. So we do a one more attempt in hope request will succeed.
		req, err = http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
		if err != nil {
			err = fmt.Errorf("failed to create new request with context: %w", err)
			return newResponseError(err, backend.StatusBadRequest)
		}
		resp, err = di.httpClient.Do(req)
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
func (d *Datasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	res := &backend.CheckHealthResult{}
	di, err := d.getInstance(ctx, req.PluginContext)
	if err != nil {
		res.Status = backend.HealthStatusError
		res.Message = "Error getting datasource instance"
		d.logger.Error("Error getting datasource instance", "err", err)
		return res, nil
	}
	healthURL, err := newURL(di.url, health, true)
	if err != nil {
		return newHealthCheckErrorf("failed to build health endpoint: %s", err), nil
	}
	r, err := http.NewRequestWithContext(ctx, http.MethodGet, healthURL.String(), nil)
	if err != nil {
		return newHealthCheckErrorf("could not create request"), nil
	}
	resp, err := di.httpClient.Do(r)
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

// RootHandler returns generic response to unsupported paths
func (d *Datasource) RootHandler(rw http.ResponseWriter, req *http.Request) {
	d.logger.Debug("Received resource call", "url", req.URL.String(), "method", req.Method)

	_, err := rw.Write([]byte("Hello from VM data source!"))
	if err != nil {
		d.logger.Warn("Error writing response")
	}

	rw.WriteHeader(http.StatusOK)
}

func newURL(urlStr, p string, root bool) (*url.URL, error) {
	if urlStr == "" {
		return nil, fmt.Errorf("url can't be blank")
	}
	u, err := url.Parse(urlStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse datasource url: %s", err)
	}
	if root {
		if idx := strings.Index(u.Path, "/select/"); idx > 0 {
			u.Path = u.Path[:idx]
		}
	}
	u.Path = path.Join(u.Path, p)
	return u, nil
}

// VMUIQuery generates VMUI link to a native dashboard
func (d *Datasource) VMUIQuery(rw http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	pluginCxt := backend.PluginConfigFromContext(ctx)
	di, err := d.getInstance(ctx, pluginCxt)
	if err != nil {
		d.logger.Error("Error loading datasource", "error", err)
		writeError(rw, http.StatusInternalServerError, err)
		return
	}
	var vmuiReq struct {
		VMUI map[string]string `json:"vmui"`
	}
	err = json.NewDecoder(req.Body).Decode(&vmuiReq)
	if err != nil {
		d.logger.Error("Error decoding request body", "error", err)
		writeError(rw, http.StatusInternalServerError, err)
		return
	}
	params := url.Values{}
	for k, vl := range di.queryParams {
		for _, v := range vl {
			params.Add(k, v)
		}
	}
	for k, v := range vmuiReq.VMUI {
		params.Add("g0."+k, v)
	}
	rw.Header().Add("Content-Type", "application/json")
	rw.WriteHeader(http.StatusOK)
	vmuiURL := di.vmuiURL + "?#/?" + params.Encode()
	_, err = fmt.Fprintf(rw, `{"vmuiURL": %q}`, vmuiURL)
	if err != nil {
		log.DefaultLogger.Warn("Error writing response")
	}
}

// VMAPIQuery performs request to VM API endpoints that doesn't return frames
func (d *Datasource) VMAPIQuery(rw http.ResponseWriter, req *http.Request) {
	ctx := req.Context()
	pluginCxt := backend.PluginConfigFromContext(ctx)
	di, err := d.getInstance(ctx, pluginCxt)
	if err != nil {
		d.logger.Error("Error loading datasource", "error", err)
		writeError(rw, http.StatusInternalServerError, err)
		return
	}
	u, err := newURL(di.url, req.URL.Path, false)
	if err != nil {
		writeError(rw, http.StatusBadRequest, fmt.Errorf("failed to parse datasource url: %w", err))
		return
	}
	u.RawQuery = req.URL.Query().Encode()
	newReq, err := http.NewRequestWithContext(ctx, req.Method, u.String(), nil)
	if err != nil {
		writeError(rw, http.StatusBadRequest, fmt.Errorf("failed to create new request with context: %w", err))
		return
	}

	resp, err := di.httpClient.Do(newReq)
	if err != nil {
		if !isTrivialError(err) {
			// Return unexpected error to the caller.
			writeError(rw, http.StatusBadRequest, err)
			return
		}

		newReq, err := http.NewRequestWithContext(ctx, req.Method, u.String(), nil)
		if err != nil {
			writeError(rw, http.StatusBadRequest, fmt.Errorf("failed to create new request with context: %w", err))
			return
		}

		// Something in the middle between client and datasource might be closing
		// the connection. So we do a one more attempt in hope request will succeed.
		resp, err = di.httpClient.Do(newReq)
		if err != nil {
			writeError(rw, http.StatusBadRequest, fmt.Errorf("failed to make http request: %w", err))
			return
		}
	}
	reader := io.Reader(resp.Body)
	if resp.Header.Get("Content-Encoding") == "gzip" {
		reader, err = gzip.NewReader(reader)
		if err != nil {
			writeError(rw, http.StatusBadRequest, fmt.Errorf("failed to create gzip reader: %w", err))
			return
		}
	}

	bodyBytes, err := io.ReadAll(reader)
	if err != nil {
		writeError(rw, http.StatusBadRequest, fmt.Errorf("failed to read http response body: %w", err))
		return
	}
	defer resp.Body.Close()

	rw.Header().Add("Content-Type", "application/json")
	rw.WriteHeader(http.StatusOK)
	_, err = rw.Write(bodyBytes)
	if err != nil {
		log.DefaultLogger.Warn("Error writing response")
	}
}

func writeError(rw http.ResponseWriter, statusCode int, err error) {
	data := make(map[string]interface{})

	data["error"] = "Internal Server Error"
	data["message"] = err.Error()

	var b []byte
	if b, err = json.Marshal(data); err != nil {
		rw.WriteHeader(statusCode)
		return
	}

	rw.Header().Add("Content-Type", "application/json")
	rw.WriteHeader(http.StatusInternalServerError)

	_, err = rw.Write(b)
	if err != nil {
		log.DefaultLogger.Warn("Error writing response")
	}
}

// getInstance Returns cached datasource or creates new one
func (d *Datasource) getInstance(ctx context.Context, pluginContext backend.PluginContext) (*DatasourceInstance, error) {
	instance, err := d.im.Get(ctx, pluginContext)
	if err != nil {
		return nil, err
	}
	return instance.(*DatasourceInstance), nil
}

func checkAlertingRequest(headers map[string]string) (bool, error) {
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
