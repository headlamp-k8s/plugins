FROM golang:1.21@sha256:4746d26432a9117a5f58e95cb9f954ddf0de128e9d5816886514199316e4a2fb AS builder
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
