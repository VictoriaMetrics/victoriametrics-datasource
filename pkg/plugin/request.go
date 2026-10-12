package plugin

import (
	"bytes"
	"context"
	"net/http"
	"net/url"
	"strings"
)

const formContentType = "application/x-www-form-urlencoded"

// newRequest builds an HTTP request to the VictoriaMetrics API.
// The query string of u (datasource URL and custom query parameters) always stays in the URL.
// POST sends params as a form-encoded body, any other method merges them into the URL query string
// after the existing values, so for a repeated key the URL value stays first
func newRequest(ctx context.Context, method string, u *url.URL, params url.Values) (*http.Request, error) {
	method = strings.ToUpper(method)
	if method == "" {
		method = http.MethodGet
	}

	if method == http.MethodPost {
		req, err := http.NewRequestWithContext(ctx, method, u.String(), strings.NewReader(params.Encode()))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", formContentType)
		return req, nil
	}

	query := u.Query()
	for k, vl := range params {
		query[k] = append(query[k], vl...)
	}
	target := *u
	target.RawQuery = query.Encode()
	return http.NewRequestWithContext(ctx, method, target.String(), nil)
}

// newProxyRequest builds the upstream request for a resource call proxied as-is:
// the method, the already buffered body and the Content-Type of the incoming request are forwarded.
func newProxyRequest(ctx context.Context, in *http.Request, u *url.URL, body []byte) (*http.Request, error) {
	req, err := http.NewRequestWithContext(ctx, in.Method, u.String(), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	if ct := in.Header.Get("Content-Type"); ct != "" {
		req.Header.Set("Content-Type", ct)
	}
	return req, nil
}
