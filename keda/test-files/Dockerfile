FROM golang:1.21 AS builder
ENV CGO_ENABLED=0

WORKDIR /publish-src
COPY ./publish/go.mod ./publish/go.sum ./
RUN go mod download
COPY ./publish/* ./
RUN go build -o /publish

WORKDIR /consume-src
COPY ./consume/go.mod ./consume/go.sum ./
RUN go mod download
COPY ./consume/* ./
RUN go build -o /consume

FROM scratch
COPY --from=builder /consume /publish /usr/local/bin/
CMD ["consume"]
