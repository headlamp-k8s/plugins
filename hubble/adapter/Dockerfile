# Builds the hubble-flows-adapter image. Run from this directory:
#   docker build -t hubble-flows-adapter .
FROM --platform=$BUILDPLATFORM golang:1.26 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
ARG TARGETOS TARGETARCH
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags='-s -w' -o /hubble-flows-adapter .

# No shell and no package manager: the adapter is a single static binary.
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /hubble-flows-adapter /hubble-flows-adapter
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/hubble-flows-adapter"]
