package plugin

import (
	"errors"
	"fmt"
	"net/url"
)

const redactedValue = "REDACTED"

// redactURL returns u in a form safe for logging: user info is dropped and
// every query parameter value is replaced, only the parameter names are kept.
func redactURL(u *url.URL) string {
	if u == nil {
		return ""
	}
	safe := *u
	safe.User = nil
	query := safe.Query()
	for k := range query {
		query[k] = []string{redactedValue}
	}
	safe.RawQuery = query.Encode()
	return safe.String()
}

// withoutURL strips the request URL from errors returned by http.Client,
// which embed the full URL, including query parameters, into their message.
func withoutURL(err error) error {
	var urlErr *url.Error
	if errors.As(err, &urlErr) {
		return fmt.Errorf("%s request failed: %w", urlErr.Op, urlErr.Err)
	}
	return err
}
