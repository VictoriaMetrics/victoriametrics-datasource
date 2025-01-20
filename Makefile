PKG_PREFIX := https://github.com/VictoriaMetrics/victoriametrics-datasource

DATEINFO_TAG ?= $(shell date -u +'%Y%m%d-%H%M%S')
BUILDINFO_TAG ?= $(shell echo $$(git describe --long --all | tr '/' '-')$$( \
	      git diff-index --quiet HEAD -- || echo '-dirty-'$$(git diff-index -u HEAD | openssl sha1 | cut -d' ' -f2 | cut -c 1-8)))

PKG_TAG ?= $(shell git tag -l --points-at HEAD)
ifeq ($(PKG_TAG),)
PKG_TAG := $(BUILDINFO_TAG)
endif

PLUGIN_ID=victoriametrics-datasource
APP_NAME=victoriametrics_backend_plugin

GO_BUILDINFO = -X '$(PKG_PREFIX)/victoriametrics-datasource/buildinfo.Version=$(APP_NAME)-$(DATEINFO_TAG)-$(BUILDINFO_TAG)'

.PHONY: $(MAKECMDGOALS)

frontend-package-base-image:
	docker build -t frontent-builder-image -f Dockerfile $(shell pwd)

frontend-build: frontend-package-base-image
	mkdir -p .npm .cache && \
	chown -R $(shell id -u):$(shell id -g) .npm .cache && \
	docker run --rm \
		-v "$(shell pwd):/victoriametrics-datasource" \
		-v "$(shell pwd)/.yarn:/.yarn" \
		-v "$(shell pwd)/.npm:/.npm" \
		-v "$(shell pwd)/.cache:/.cache" \
		-w /victoriametrics-datasource \
		--user $(shell id -u):$(shell id -g) \
		--env YARN_CACHE_FOLDER="/victoriametrics-datasource/.cache" \
		--entrypoint=/bin/bash \
		frontent-builder-image -c "yarn install --omit=dev && yarn build"

app-via-docker-local:
	$(eval OS := $(shell docker run $(GO_BUILDER_IMAGE) go env GOOS))
	$(eval ARCH := $(shell docker run $(GO_BUILDER_IMAGE) go env GOARCH))
	$(MAKE) app-via-docker-$(OS)-$(ARCH)

vm-backend-plugin-build: mage
	$(MAGE) -v

vm-frontend-plugin-build: frontend-build

vm-plugin-build-local: vm-frontend-plugin-build app-via-docker-local

vm-plugin-build: vm-frontend-plugin-build vm-backend-plugin-build

vm-plugin-pack: vm-plugin-build
	mkdir -p dist && \
	$(eval PACKAGE_NAME := $(PLUGIN_ID)-$(PKG_TAG)) \
	cd plugins/ && \
	tar -czf ../dist/$(PACKAGE_NAME).tar.gz ./$(PLUGIN_ID) && \
	zip -q -r ../dist/$(PACKAGE_NAME).zip ./$(PLUGIN_ID) && \
	cd - && \
	sha1sum dist/$(PACKAGE_NAME).zip > dist/$(PACKAGE_NAME)_checksums_zip.txt && \
	sha1sum dist/$(PACKAGE_NAME).tar.gz > dist/$(PACKAGE_NAME)_checksums_tar.gz.txt

vm-plugin-cleanup:
	rm -rf ./victoriametrics-datasource plugins

vm-plugin-release: \
	vm-plugin-pack \
	vm-plugin-cleanup

build-release:
	git checkout $(TAG) && $(MAKE) vm-plugin-release

golang-test:
	go test ./pkg/...

golang-test-race:
	go test -race ./pkg/...

lint: golangci-lint
	$(GOLANGCI_LINT) run ./pkg/...

fmt:
	gofmt -l -w -s ./pkg

vet:
	go vet ./pkg/...

check-all: fmt vet golangci-lint

vm-plugin-check: vm-plugin-release plugincheck2
	$(eval PACKAGE_NAME := $(PLUGIN_ID)-$(PKG_TAG)) \
	$(PLUGINCHECK2) -sourceCodeUri file://$(shell pwd)/ "$(shell pwd)/dist/${PACKAGE_NAME}.zip"

LOCALBIN ?= $(shell pwd)/bin
$(LOCALBIN):
	mkdir -p $(LOCALBIN)

PLUGINCHECK2 = $(LOCALBIN)/plugincheck2-$(PLUGINCHECK2_VERSION)
MAGE = $(LOCALBIN)/mage-$(MAGE_VERSION)
GOLANGCI_LINT = $(LOCALBIN)/golangci-lint-$(GOLANGCI_LINT_VERSION)

PLUGINCHECK2_VERSION = v0.20.3
MAGE_VERSION = v1.15.0
GOLANGCI_LINT_VERSION = v1.62.2

.PHONY: plugincheck2
plugincheck2: $(PLUGINCHECK2)
$(PLUGINCHECK2): $(LOCALBIN)
	$(call go-install-tool,$(PLUGINCHECK2),github.com/grafana/plugin-validator/pkg/cmd/plugincheck2,$(PLUGINCHECK2_VERSION))

.PHONY: mage
mage: $(MAGE)
$(MAGE): $(LOCALBIN)
	$(call go-install-tool,$(MAGE),github.com/magefile/mage,$(MAGE_VERSION))

.PHONY: golangci-lint
golangci-lint: $(GOLANGCI_LINT) ## Download golangci-lint locally if necessary.
$(GOLANGCI_LINT): $(LOCALBIN)
	$(call go-install-tool,$(GOLANGCI_LINT),github.com/golangci/golangci-lint/cmd/golangci-lint,$(GOLANGCI_LINT_VERSION))

# go-install-tool will 'go install' any package with custom target and name of binary, if it doesn't exist
# $1 - target path with name of binary (ideally with version)
# $2 - package url which can be installed
# $3 - specific version of package
define go-install-tool
@[ -f $(1) ] || { \
set -e; \
package=$(2)@$(3) ;\
echo "Downloading $${package}" ;\
GOBIN=$(LOCALBIN) go install $${package} ;\
mv "$$(echo "$(1)" | sed "s/-$(3)$$//")" $(1) || echo "move not needed" ;\
}
endef
