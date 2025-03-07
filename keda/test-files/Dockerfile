FROM golang:1.18 AS builder
ENV CGO_ENABLED=0

WORKDIR /send-src
COPY ./send/go.mod ./send/go.sum ./
RUN go mod download
COPY ./send/* ./
RUN go build -o /send

WORKDIR /receive-src
COPY ./receive/go.mod ./receive/go.sum ./
RUN go mod download
COPY ./receive/* ./
RUN go build -o /receive

FROM scratch
COPY --from=builder /receive /send /usr/local/bin/
CMD ["receive"]