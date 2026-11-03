package plugin

import (
	"errors"
	"fmt"
	"net/url"
	"strings"
	"testing"
)

func TestRedactURL(t *testing.T) {
	cases := []struct {
		name string
		in   string
		want string
	}{
		{
			name: "nil url",
			in:   "",
			want: "",
		},
		{
			name: "no query",
			in:   "http://vm:8428/api/v1/query",
			want: "http://vm:8428/api/v1/query",
		},
		{
			name: "user info and query values are hidden",
			in:   "http://user:secret@vm:8428/select/0/prometheus/api/v1/query?query=up&token=abc&token=def",
			want: "http://vm:8428/select/0/prometheus/api/v1/query?query=REDACTED&token=REDACTED",
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var u *url.URL
			if c.in != "" {
				parsed, err := url.Parse(c.in)
				if err != nil {
					t.Fatalf("failed to parse %q: %s", c.in, err)
				}
				u = parsed
			}
			if got := redactURL(u); got != c.want {
				t.Errorf("redactURL(%q) = %q, want %q", c.in, got, c.want)
			}
		})
	}
}

func TestWithoutURL(t *testing.T) {
	cause := errors.New("connection refused")
	urlErr := &url.Error{Op: "Get", URL: "http://vm:8428/api/v1/query?token=secret", Err: cause}

	got := withoutURL(fmt.Errorf("failed to make http request: %w", urlErr))
	if strings.Contains(got.Error(), "token=secret") {
		t.Fatalf("expected the url to be stripped, got %q", got)
	}
	if !errors.Is(got, cause) {
		t.Fatalf("expected the cause to be kept, got %q", got)
	}
	if got.Error() != "Get request failed: connection refused" {
		t.Errorf("unexpected message %q", got)
	}

	plain := errors.New("plain error")
	if withoutURL(plain) != plain {
		t.Errorf("expected a non-url error to be returned as is")
	}
}
