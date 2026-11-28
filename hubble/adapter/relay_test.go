/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package main

import (
	"context"
	"maps"
	"net"
	"os"
	"path/filepath"
	"reflect"
	"slices"
	"sync"
	"testing"
	"time"

	flowpb "github.com/cilium/cilium/api/v1/flow"
	observerpb "github.com/cilium/cilium/api/v1/observer"
	relaypb "github.com/cilium/cilium/api/v1/relay"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protowire"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/fieldmaskpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// fakeObserver is a Relay that answers GetFlows with fixed responses.
type fakeObserver struct {
	observerpb.UnimplementedObserverServer
	responses []*observerpb.GetFlowsResponse
	err       error
	request   *observerpb.GetFlowsRequest
	// oldest is the time of the oldest flow each node keeps. Like Relay, a request with
	// first set gets the first flow of every node.
	oldest    map[string]time.Time
	oldestErr error

	mu            sync.Mutex
	firstRequests []*observerpb.GetFlowsRequest
}

func (f *fakeObserver) GetFlows(request *observerpb.GetFlowsRequest, stream grpc.ServerStreamingServer[observerpb.GetFlowsResponse]) error {
	if request.GetFirst() {
		f.mu.Lock()
		f.firstRequests = append(f.firstRequests, request)
		f.mu.Unlock()
		if f.oldestErr != nil {
			return f.oldestErr
		}
		for _, node := range slices.Sorted(maps.Keys(f.oldest)) {
			flow := &flowpb.Flow{Time: timestamppb.New(f.oldest[node]), NodeName: node}
			if err := stream.Send(flowResponse(flow)); err != nil {
				return err
			}
		}
		return nil
	}
	f.request = request
	for _, response := range f.responses {
		if err := stream.Send(response); err != nil {
			return err
		}
	}
	return f.err
}

// oldestRequests returns the requests with first set that the fake got.
func (f *fakeObserver) oldestRequests() []*observerpb.GetFlowsRequest {
	f.mu.Lock()
	defer f.mu.Unlock()
	return slices.Clone(f.firstRequests)
}

// startRelay serves the fake on a local port and returns a Relay client for it.
func startRelay(t *testing.T, observer *fakeObserver) *Relay {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	server := grpc.NewServer()
	observerpb.RegisterObserverServer(server, observer)
	go server.Serve(listener)
	t.Cleanup(server.Stop)

	relay, err := NewRelay(listener.Addr().String(), TLSFiles{})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { relay.Close() })
	return relay
}

func flowResponse(flow *flowpb.Flow) *observerpb.GetFlowsResponse {
	return &observerpb.GetFlowsResponse{ResponseTypes: &observerpb.GetFlowsResponse_Flow{Flow: flow}}
}

func lostResponse(count uint64) *observerpb.GetFlowsResponse {
	return &observerpb.GetFlowsResponse{
		ResponseTypes: &observerpb.GetFlowsResponse_LostEvents{LostEvents: &flowpb.LostEvent{NumEventsLost: count}},
	}
}

func TestFlowsReturnsFlowsAndAddsUpLostEvents(t *testing.T) {
	withoutIP := tcpFlow()
	withoutIP.IP = nil
	observer := &fakeObserver{responses: []*observerpb.GetFlowsResponse{
		flowResponse(tcpFlow()),
		lostResponse(3),
		flowResponse(withoutIP),
		lostResponse(4),
		flowResponse(tcpFlow()),
	}}

	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "", 500)
	if err != nil {
		t.Fatal(err)
	}
	if len(snapshot.Flows) != 2 {
		t.Errorf("got %d flows, want the 2 with IP addresses", len(snapshot.Flows))
	}
	if snapshot.LostEvents != 7 {
		t.Errorf("LostEvents = %d, want 7", snapshot.LostEvents)
	}
}

func TestFlowsAsksRelayForOnlyWhatItNeeds(t *testing.T) {
	observer := &fakeObserver{responses: []*observerpb.GetFlowsResponse{
		nodeStatus(relaypb.NodeState_NODE_CONNECTED, "c/a"),
	}}
	if _, err := startRelay(t, observer).Flows(context.Background(), "shop", "web-1", 500); err != nil {
		t.Fatal(err)
	}

	request := observer.request
	if request.GetNumber() != 500 {
		t.Errorf("Number = %d, want 500", request.GetNumber())
	}
	if request.GetFollow() {
		t.Error("the request follows new flows, want a snapshot")
	}
	if !reflect.DeepEqual(request.GetFieldMask().GetPaths(), flowFields) {
		t.Errorf("field mask = %v", request.GetFieldMask().GetPaths())
	}
	if len(request.GetWhitelist()) != 3 {
		t.Fatalf("got %d filters, want 3", len(request.GetWhitelist()))
	}
	for i, want := range podFilters("shop", "web-1") {
		if !proto.Equal(request.GetWhitelist()[i], want) {
			t.Errorf("filter %d is %v, want %v", i, request.GetWhitelist()[i], want)
		}
	}

	// Cilium 1.14 and 1.15 only read the mask from experimental.field_mask (field 1).
	raw := request.GetExperimental().ProtoReflect().GetUnknown()
	number, wireType, n := protowire.ConsumeTag(raw)
	if n < 0 || number != legacyFieldMaskNumber || wireType != protowire.BytesType {
		t.Fatalf("experimental is %x, want field 1 with the field mask", raw)
	}
	encoded, n := protowire.ConsumeBytes(raw[n:])
	if n < 0 {
		t.Fatalf("experimental is %x, want field 1 with the field mask", raw)
	}
	var legacy fieldmaskpb.FieldMask
	if err := proto.Unmarshal(encoded, &legacy); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(legacy.GetPaths(), flowFields) {
		t.Errorf("experimental field mask = %v, want %v", legacy.GetPaths(), flowFields)
	}
}

func TestFlowsReturnsAnEmptyListWhenRelayHasNothing(t *testing.T) {
	observer := &fakeObserver{responses: []*observerpb.GetFlowsResponse{
		nodeStatus(relaypb.NodeState_NODE_CONNECTED, "c/a", "c/b"),
	}}
	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "", 500)
	if err != nil {
		t.Fatal(err)
	}
	if snapshot.Flows == nil || len(snapshot.Flows) != 0 {
		t.Errorf("Flows = %v, want an empty list that encodes as []", snapshot.Flows)
	}
}

func TestFlowsOfOnePodLeaveOutPodsThatOnlyShareItsNamePrefix(t *testing.T) {
	// Relay's pod filter matches name prefixes, so for web-1 it also sends web-10's flows.
	between := func(source, destination string) *observerpb.GetFlowsResponse {
		flow := tcpFlow()
		flow.Source.PodName = source
		flow.Destination.PodName = destination
		return flowResponse(flow)
	}
	observer := &fakeObserver{responses: []*observerpb.GetFlowsResponse{
		between("web-1", "backend-0"),
		between("web-10", "backend-0"),
		between("frontend-5d772", "web-1"),
		between("frontend-5d772", "web-12"),
	}}

	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "web-1", 500)
	if err != nil {
		t.Fatal(err)
	}
	var got [][2]string
	for _, flow := range snapshot.Flows {
		got = append(got, [2]string{flow.Source.Pod, flow.Destination.Pod})
	}
	want := [][2]string{{"web-1", "backend-0"}, {"frontend-5d772", "web-1"}}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("flows between %v, want only web-1's %v", got, want)
	}
}

func TestFlowsPassesOnRelayErrors(t *testing.T) {
	observer := &fakeObserver{
		responses: []*observerpb.GetFlowsResponse{flowResponse(tcpFlow())},
		err:       status.Error(codes.Unavailable, "no peers"),
	}
	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "", 500)
	if status.Code(err) != codes.Unavailable {
		t.Errorf("err = %v, want Unavailable", err)
	}
	if len(snapshot.Flows) != 0 {
		t.Error("a failed read returned part of the flows")
	}
}

func TestPodFiltersForANamespaceAndForOnePod(t *testing.T) {
	for _, pod := range []string{"", "web-1"} {
		prefix := "shop/" + pod
		filters := podFilters("shop", pod)
		sent, received, leaving := filters[0], filters[1], filters[2]

		if !reflect.DeepEqual(sent.GetSourcePod(), []string{prefix}) || len(sent.GetDestinationPod()) != 0 {
			t.Errorf("%s: sent filter is %v", prefix, sent)
		}
		if !reflect.DeepEqual(received.GetDestinationPod(), []string{prefix}) || len(received.GetSourcePod()) != 0 {
			t.Errorf("%s: received filter is %v", prefix, received)
		}
		// In the cluster: drops of any kind and deliveries to a pod.
		for _, filter := range []*flowpb.FlowFilter{sent, received} {
			types := filter.GetEventType()
			if len(types) != 2 ||
				types[0].GetType() != messageTypeDrop || types[0].GetMatchSubType() ||
				types[1].GetType() != messageTypeTrace || !types[1].GetMatchSubType() || types[1].GetSubType() != traceToEndpoint {
				t.Errorf("%s: in-cluster event types are %v", prefix, types)
			}
		}
		// The sending checkpoints are only asked for traffic leaving the cluster.
		// Dual-stack clusters label it world-ipv4 or world-ipv6, which reserved:world doesn't select.
		world := []string{"reserved:world", "reserved:world-ipv4", "reserved:world-ipv6"}
		if !reflect.DeepEqual(leaving.GetDestinationLabel(), world) ||
			!reflect.DeepEqual(leaving.GetSourcePod(), []string{prefix}) {
			t.Errorf("%s: leaving filter is %v", prefix, leaving)
		}
		for _, eventType := range leaving.GetEventType() {
			if eventType.GetType() != messageTypeTrace || !eventType.GetMatchSubType() || eventType.GetSubType() == traceToEndpoint {
				t.Errorf("%s: leaving event type is %v", prefix, eventType)
			}
		}
		// The pod filter also selects web-10 for web-1, so for one pod CEL keeps only that
		// pod, and web-10's flows don't use up the limit. A namespace needs none.
		var bySource, byDestination []string
		if pod != "" {
			bySource = []string{`_flow.source.pod_name == "web-1"`}
			byDestination = []string{`_flow.destination.pod_name == "web-1"`}
		}
		for _, check := range []struct {
			name   string
			filter *flowpb.FlowFilter
			want   []string
		}{{"sent", sent, bySource}, {"received", received, byDestination}, {"leaving", leaving, bySource}} {
			if got := check.filter.GetExperimental().GetCelExpression(); !reflect.DeepEqual(got, check.want) {
				t.Errorf("%s: %s filter's CEL expressions are %q, want %q", prefix, check.name, got, check.want)
			}
		}
	}
}

func TestTransportCredentialsChecksTheTLSFiles(t *testing.T) {
	dir := t.TempDir()
	notACert := filepath.Join(dir, "ca.crt")
	if err := os.WriteFile(notACert, []byte("not a certificate"), 0o600); err != nil {
		t.Fatal(err)
	}

	bad := map[string]TLSFiles{
		"client certificate without a CA": {CertFile: "tls.crt", KeyFile: "tls.key"},
		"missing CA file":                 {CAFile: filepath.Join(dir, "missing.crt")},
		"CA file without certificates":    {CAFile: notACert},
	}
	for name, files := range bad {
		if _, err := transportCredentials(files); err == nil {
			t.Errorf("%s: no error", name)
		}
	}

	creds, err := transportCredentials(TLSFiles{})
	if err != nil {
		t.Fatal(err)
	}
	if protocol := creds.Info().SecurityProtocol; protocol != "insecure" {
		t.Errorf("no TLS files gave %q credentials, want plaintext", protocol)
	}
}

// flowAt is a TCP flow recorded by node at second second.
func flowAt(node string, second int) *flowpb.Flow {
	flow := tcpFlow()
	flow.NodeName = node
	flow.Time = timestamppb.New(time.Unix(int64(second), 0))
	return flow
}

func TestFlowsKeepOnlyTheTimeEveryNodeCovers(t *testing.T) {
	observer := &fakeObserver{
		responses: []*observerpb.GetFlowsResponse{
			flowResponse(flowAt("c/quiet", 10)),
			flowResponse(flowAt("c/quiet", 20)),
			flowResponse(flowAt("c/busy", 25)),
			flowResponse(flowAt("c/quiet", 30)),
		},
		// The busy node only remembers from second 20 on.
		oldest: map[string]time.Time{"c/quiet": time.Unix(5, 0), "c/busy": time.Unix(20, 0)},
	}
	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "", 500)
	if err != nil {
		t.Fatal(err)
	}
	var seconds []int64
	for _, flow := range snapshot.Flows {
		seconds = append(seconds, flow.Time.Unix())
	}
	if !reflect.DeepEqual(seconds, []int64{20, 25, 30}) {
		t.Errorf("kept flows at %v, want the ones from second 20 on", seconds)
	}
}

func TestFlowsAskEveryNodeForItsOldestFlowInOneRequest(t *testing.T) {
	// Relay sends a request to every node it's connected to, also with a node filter, so
	// one request per node would ask every node once for each of them.
	observer := &fakeObserver{
		responses: []*observerpb.GetFlowsResponse{
			flowResponse(flowAt("c/a", 10)),
			flowResponse(flowAt("c/b", 20)),
			flowResponse(flowAt("c/c", 30)),
		},
		// c/b only remembers from second 15 on. c/idle sent no flows of the namespace, so
		// what it remembers doesn't matter.
		oldest: map[string]time.Time{
			"c/a":    time.Unix(5, 0),
			"c/b":    time.Unix(15, 0),
			"c/c":    time.Unix(1, 0),
			"c/idle": time.Unix(25, 0),
		},
	}
	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "", 500)
	if err != nil {
		t.Fatal(err)
	}
	requests := observer.oldestRequests()
	if len(requests) != 1 {
		t.Fatalf("asked for the oldest flows %d times, want once for all nodes", len(requests))
	}
	if got := requests[0]; len(got.GetWhitelist()) != 0 || got.GetNumber() != 1 {
		t.Errorf("asked with filters %v and number %d, want no filter and 1", got.GetWhitelist(), got.GetNumber())
	}
	if got := requests[0].GetFieldMask().GetPaths(); !reflect.DeepEqual(got, []string{"time", "node_name"}) {
		t.Errorf("field mask %v, want time and node_name", got)
	}
	if got := secondsOf(snapshot); !reflect.DeepEqual(got, []int64{20, 30}) {
		t.Errorf("kept flows at %v, want the ones from second 15 on", got)
	}
}

func TestFlowsAreKeptWhenANodeCannotBeAsked(t *testing.T) {
	observer := &fakeObserver{
		responses: []*observerpb.GetFlowsResponse{
			flowResponse(flowAt("c/quiet", 10)),
			flowResponse(flowAt("c/busy", 25)),
		},
		oldestErr: status.Error(codes.Unavailable, "node gone"),
	}
	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "", 500)
	if err != nil {
		t.Fatal(err)
	}
	if len(snapshot.Flows) != 2 {
		t.Errorf("got %d flows, want both when the oldest flow can't be read", len(snapshot.Flows))
	}
}

func nodeStatus(state relaypb.NodeState, nodes ...string) *observerpb.GetFlowsResponse {
	return &observerpb.GetFlowsResponse{ResponseTypes: &observerpb.GetFlowsResponse_NodeStatus{
		NodeStatus: &relaypb.NodeStatusEvent{StateChange: state, NodeNames: nodes},
	}}
}

func TestFlowsSayWhichNodesRelayCouldNotRead(t *testing.T) {
	observer := &fakeObserver{responses: []*observerpb.GetFlowsResponse{
		nodeStatus(relaypb.NodeState_NODE_CONNECTED, "c/a", "c/b"),
		nodeStatus(relaypb.NodeState_NODE_UNAVAILABLE, "c/d"),
		flowResponse(tcpFlow()),
		nodeStatus(relaypb.NodeState_NODE_ERROR, "c/b", "c/d"),
	}}
	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "", 500)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(snapshot.UnreadNodes, []string{"c/b", "c/d"}) {
		t.Errorf("UnreadNodes = %v, want c/b and c/d", snapshot.UnreadNodes)
	}
	if len(snapshot.Flows) != 1 {
		t.Errorf("got %d flows, want the 1 that was read", len(snapshot.Flows))
	}
}

func TestFlowsFailWhenRelayIsNotConnectedToAnyNode(t *testing.T) {
	// Relay without nodes ends the stream right away, without even a node status.
	_, err := startRelay(t, &fakeObserver{}).Flows(context.Background(), "shop", "", 500)
	if status.Code(err) != codes.Unavailable {
		t.Errorf("err = %v, want Unavailable", err)
	}
}

// secondsOf returns when each flow was recorded.
func secondsOf(snapshot Snapshot) []int64 {
	var seconds []int64
	for _, flow := range snapshot.Flows {
		seconds = append(seconds, flow.Time.Unix())
	}
	return seconds
}

func TestFlowsKeepTheNewestFlowsOfAllNodesUpToTheLimit(t *testing.T) {
	// Relay asks each node for the limit, so two nodes can send twice as many flows, and
	// one node's flows can come before the other's older ones.
	observer := &fakeObserver{responses: []*observerpb.GetFlowsResponse{
		flowResponse(flowAt("c/a", 10)),
		flowResponse(flowAt("c/a", 30)),
		flowResponse(flowAt("c/b", 20)),
		flowResponse(flowAt("c/b", 40)),
	}}
	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "", 2)
	if err != nil {
		t.Fatal(err)
	}
	if got := secondsOf(snapshot); !reflect.DeepEqual(got, []int64{30, 40}) {
		t.Errorf("kept flows at %v, want the 2 newest, oldest first", got)
	}
}

func TestFlowsOfANodeThatSentAsManyAsAskedOnlyCoverWhatItSent(t *testing.T) {
	// On Cilium 1.15 and older web-10's flows count toward web-1's limit. The busy node
	// sent as many as it was asked for, so it may have older flows of web-1, and the quiet
	// node's flow from before them would only show one side.
	from := func(node string, second int, pod string) *observerpb.GetFlowsResponse {
		flow := flowAt(node, second)
		flow.Source.PodName = pod
		return flowResponse(flow)
	}
	observer := &fakeObserver{
		responses: []*observerpb.GetFlowsResponse{
			from("c/quiet", 1, "web-1"),
			from("c/busy", 5, "web-10"),
			from("c/busy", 6, "web-1"),
		},
		oldest: map[string]time.Time{"c/quiet": time.Unix(0, 0), "c/busy": time.Unix(0, 0)},
	}
	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "web-1", 2)
	if err != nil {
		t.Fatal(err)
	}
	if got := secondsOf(snapshot); !reflect.DeepEqual(got, []int64{6}) {
		t.Errorf("kept flows at %v, want only the one from second 5 on", got)
	}
}

func TestFlowsAreKeptWhenRelaySendsNoOldestFlowOfANode(t *testing.T) {
	// Relay ends the stream without a flow when it can't read the node, so what the node
	// covers is unknown and the other node's time alone drops nothing.
	observer := &fakeObserver{
		responses: []*observerpb.GetFlowsResponse{
			flowResponse(flowAt("c/quiet", 10)),
			flowResponse(flowAt("c/busy", 25)),
		},
		oldest: map[string]time.Time{"c/busy": time.Unix(20, 0)},
	}
	snapshot, err := startRelay(t, observer).Flows(context.Background(), "shop", "", 500)
	if err != nil {
		t.Fatal(err)
	}
	if got := secondsOf(snapshot); !reflect.DeepEqual(got, []int64{10, 25}) {
		t.Errorf("kept flows at %v, want both", got)
	}
}
