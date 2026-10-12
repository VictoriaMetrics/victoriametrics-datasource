package plugin

import (
	"context"
	"io"
	"net/http"
	"net/url"
	"testing"
)

func TestNewRequest(t *testing.T) {
	baseURL, err := url.Parse("http://localhost:8428/api/v1/query_range")
	if err != nil {
		t.Fatalf("failed to parse url: %s", err)
	}
	params := url.Values{}
	params.Set("query", "up{job=\"a b\"}")
	params.Set("step", "15s")

	t.Run("GET puts params into the URL query string", func(t *testing.T) {
		req, err := newRequest(context.Background(), http.MethodGet, baseURL, params)
		if err != nil {
			t.Fatalf("unexpected error: %s", err)
		}
		if req.Method != http.MethodGet {
			t.Errorf("expected method GET, got %s", req.Method)
		}
		if got := req.URL.String(); got != "http://localhost:8428/api/v1/query_range?query=up%7Bjob%3D%22a+b%22%7D&step=15s" {
			t.Errorf("unexpected url: %s", got)
		}
		if req.Body != nil {
			t.Errorf("expected empty body for GET")
		}
		if ct := req.Header.Get("Content-Type"); ct != "" {
			t.Errorf("expected no Content-Type for GET, got %q", ct)
		}
	})

	t.Run("POST puts params into a form-urlencoded body and keeps the URL clean", func(t *testing.T) {
		req, err := newRequest(context.Background(), http.MethodPost, baseURL, params)
		if err != nil {
			t.Fatalf("unexpected error: %s", err)
		}
		if req.Method != http.MethodPost {
			t.Errorf("expected method POST, got %s", req.Method)
		}
		if got := req.URL.String(); got != "http://localhost:8428/api/v1/query_range" {
			t.Errorf("unexpected url: %s", got)
		}
		if ct := req.Header.Get("Content-Type"); ct != "application/x-www-form-urlencoded" {
			t.Errorf("unexpected Content-Type: %q", ct)
		}
		body, err := io.ReadAll(req.Body)
		if err != nil {
			t.Fatalf("failed to read body: %s", err)
		}
		if got := string(body); got != "query=up%7Bjob%3D%22a+b%22%7D&step=15s" {
			t.Errorf("unexpected body: %s", got)
		}
	})

	t.Run("method is case-insensitive", func(t *testing.T) {
		req, err := newRequest(context.Background(), "post", baseURL, params)
		if err != nil {
			t.Fatalf("unexpected error: %s", err)
		}
		if req.Method != http.MethodPost {
			t.Errorf("expected method POST, got %s", req.Method)
		}
		if req.URL.RawQuery != "" {
			t.Errorf("expected empty query string, got %q", req.URL.RawQuery)
		}
	})

	t.Run("empty method falls back to GET", func(t *testing.T) {
		req, err := newRequest(context.Background(), "", baseURL, params)
		if err != nil {
			t.Fatalf("unexpected error: %s", err)
		}
		if req.Method != http.MethodGet {
			t.Errorf("expected method GET, got %s", req.Method)
		}
		if req.URL.RawQuery != "query=up%7Bjob%3D%22a+b%22%7D&step=15s" {
			t.Errorf("unexpected query string: %q", req.URL.RawQuery)
		}
	})

	t.Run("GET merges params into the existing URL query string, keeping its values first", func(t *testing.T) {
		u, err := url.Parse("http://localhost:8428/api/v1/query_range?nocache=1&step=1m")
		if err != nil {
			t.Fatalf("failed to parse url: %s", err)
		}
		req, err := newRequest(context.Background(), http.MethodGet, u, params)
		if err != nil {
			t.Fatalf("unexpected error: %s", err)
		}
		if got := req.URL.String(); got != "http://localhost:8428/api/v1/query_range?nocache=1&query=up%7Bjob%3D%22a+b%22%7D&step=1m&step=15s" {
			t.Errorf("unexpected url: %s", got)
		}
		if u.RawQuery != "nocache=1&step=1m" {
			t.Errorf("newRequest mutated the input url: %q", u.RawQuery)
		}
	})

	t.Run("POST keeps the existing URL query string and sends only params in the body", func(t *testing.T) {
		u, err := url.Parse("http://localhost:8428/api/v1/query_range?nocache=1")
		if err != nil {
			t.Fatalf("failed to parse url: %s", err)
		}
		req, err := newRequest(context.Background(), http.MethodPost, u, params)
		if err != nil {
			t.Fatalf("unexpected error: %s", err)
		}
		if got := req.URL.String(); got != "http://localhost:8428/api/v1/query_range?nocache=1" {
			t.Errorf("unexpected url: %s", got)
		}
		body, err := io.ReadAll(req.Body)
		if err != nil {
			t.Fatalf("failed to read body: %s", err)
		}
		if got := string(body); got != "query=up%7Bjob%3D%22a+b%22%7D&step=15s" {
			t.Errorf("unexpected body: %s", got)
		}
	})

	t.Run("does not mutate the given URL", func(t *testing.T) {
		if _, err := newRequest(context.Background(), http.MethodGet, baseURL, params); err != nil {
			t.Fatalf("unexpected error: %s", err)
		}
		if baseURL.RawQuery != "" {
			t.Errorf("newRequest mutated the input url: %q", baseURL.RawQuery)
		}
	})
}

func TestMergeValues(t *testing.T) {
	dst := url.Values{"a": {"1"}, "shared": {"dst"}}
	src := url.Values{"b": {"2", "3"}, "shared": {"src"}}
	mergeValues(dst, src)
	if got := dst.Encode(); got != "a=1&b=2&b=3&shared=dst&shared=src" {
		t.Errorf("unexpected merge result: %s", got)
	}
	if got := src.Encode(); got != "b=2&b=3&shared=src" {
		t.Errorf("mergeValues mutated src: %s", got)
	}
}
