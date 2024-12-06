PKG_PREFIX := https://github.com/VictoriaMetrics/victoriametrics-datasource

DATEINFO_TAG ?= $(shell date -u +'%Y%m%d-%H%M%S')
BUILDINFO_TAG ?= $(shell echo $$(git describe --long --all | tr '/' '-')$$( \
	      git diff-index --quiet HEAD -- || echo '-dirty-'$$(git diff-index -u HEAD | openssl sha1 | cut -d' ' -f2 | cut -c 1-8)))

PKG_TAG ?= $(shell git tag -l --points-at HEAD)
ifeq ($(PKG_TAG),)
PKG_TAG := $(BUILDINFO_TAG)
endif

APP_NAME=victoriametrics_backend_plugin

GO_BUILDINFO = -X '$(PKG_PREFIX)/victoriametrics-datasource/buildinfo.Version=$(APP_NAME)-$(DATEINFO_TAG)-$(BUILDINFO_TAG)'

.PHONY: $(MAKECMDGOALS)

include deployment/*/Makefile

app-via-docker-linux-amd64:
	CGO_ENABLED=1 GOOS=linux GOARCH=amd64 $(MAKE) app-via-docker

app-via-docker-linux-arm:
	CGO_ENABLED=0 GOOS=linux GOARCH=arm $(MAKE) app-via-docker

app-via-docker-linux-386:
	CGO_ENABLED=0 GOOS=linux GOARCH=386 $(MAKE) app-via-docker

app-via-docker-linux-arm64:
	DOCKER_OPTS='--env CC=/opt/cross-builder/aarch64-linux-musl-cross/bin/aarch64-linux-musl-gcc' CGO_ENABLED=1 GOOS=linux GOARCH=arm64 $(MAKE) app-via-docker

app-via-docker-darwin-amd64:
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 $(MAKE) app-via-docker

app-via-docker-darwin-arm64:
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 $(MAKE) app-via-docker

app-via-docker-windows-arm64:
	CGO_ENABLED=0 GOOS=windows GOARCH=arm64 $(MAKE) app-via-docker

app-via-docker-windows-amd64:
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(MAKE) app-via-docker

app-via-docker-local:
	$(eval OS := $(shell docker run $(GO_BUILDER_IMAGE) go env GOOS))
	$(eval ARCH := $(shell docker run $(GO_BUILDER_IMAGE) go env GOARCH))
	$(MAKE) app-via-docker-$(OS)-$(ARCH)

vm-backend-plugin-build: \
	app-via-docker-linux-amd64 \
	app-via-docker-linux-arm \
	app-via-docker-linux-arm64 \
	app-via-docker-linux-386 \
	app-via-docker-darwin-amd64 \
	app-via-docker-darwin-arm64 \
	app-via-docker-windows-amd64 \
	app-via-docker-windows-arm64

vm-frontend-plugin-build: frontend-build

vm-plugin-build-local: vm-frontend-plugin-build app-via-docker-local
	rm -rf plugins/vm-datasource && \
	cp -r plugins/frontend plugins/vm-datasource && \
	cp plugins/backend/$(APP_NAME)_* plugins/vm-datasource/

vm-plugin-build: vm-frontend-plugin-build vm-backend-plugin-build

vm-plugin-pack-zip: vm-plugin-build
	mkdir -p dist && \
	$(foreach plugin,$(wildcard plugins/backend/$(APP_NAME)_*),\
		$(eval SUFFIX := $(subst $(APP_NAME)_,,$(notdir $(plugin)))) \
		$(eval PACKAGE_NAME := victoriametrics-datasource-$(PKG_TAG).$(SUFFIX).zip) \
		rm -rf plugins/vm-datasource && \
		cp -r plugins/frontend plugins/vm-datasource && \
		cp $(plugin) plugins/vm-datasource/ && \
		cd plugins/vm-datasource && \
		zip -q -r ../../dist/$(PACKAGE_NAME) . && \
		cd - && \
		sha256sum dist/$(PACKAGE_NAME) > dist/$(PACKAGE_NAME).txt;)

vm-plugin-cleanup:
	rm -rf ./victoriametrics-datasource plugins

vm-plugin-release: \
	vm-plugin-pack-zip \
	vm-plugin-cleanup

build-release:
	git checkout $(TAG) && $(MAKE) vm-plugin-release

golang-test:
	go test ./pkg/...

golang-test-race:
	go test -race ./pkg/...

golang-ci-lint: install-golang-ci-lint
	golangci-lint run ./pkg/...

install-golang-ci-lint:
	which golangci-lint || curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(shell go env GOPATH)/bin v1.62.2

fmt:
	gofmt -l -w -s ./pkg

vet:
	go vet ./pkg/...

check-all: fmt vet golang-ci-lint
