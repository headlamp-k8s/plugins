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
	"container/heap"
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"os"
	"slices"
	"time"

	flowpb "github.com/cilium/cilium/api/v1/flow"
	observerpb "github.com/cilium/cilium/api/v1/observer"
	relaypb "github.com/cilium/cilium/api/v1/relay"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protowire"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/fieldmaskpb"
)

// TLSFiles are the files for a TLS connection to Relay. With no CAFile the connection
// is plaintext, which is how Relay listens unless its server TLS is turned on.
type TLSFiles struct {
	CAFile     string
	CertFile   string
	KeyFile    string
	ServerName string
}

// Snapshot is the recent flows Relay had for a query.
type Snapshot struct {
	Flows []Flow `json:"flows"`
	// LostEvents is how many events the nodes said they dropped before recording them.
	LostEvents uint64 `json:"lostEvents"`
	// UnreadNodes are the nodes Relay couldn't read flows from, so their flows are
	// missing from the snapshot.
	UnreadNodes []string `json:"unreadNodes,omitempty"`
}

// Relay reads flows from Hubble Relay.
type Relay struct {
	conn   *grpc.ClientConn
	client observerpb.ObserverClient
}

// NewRelay prepares a client for the Relay at address. It connects on first use.
func NewRelay(address string, files TLSFiles) (*Relay, error) {
	creds, err := transportCredentials(files)
	if err != nil {
		return nil, err
	}
	conn, err := grpc.NewClient(address, grpc.WithTransportCredentials(creds))
	if err != nil {
		return nil, fmt.Errorf("create Relay client for %s: %w", address, err)
	}
	return &Relay{conn: conn, client: observerpb.NewObserverClient(conn)}, nil
}

// Close closes the connection to Relay.
func (r *Relay) Close() error {
	return r.conn.Close()
}

func transportCredentials(files TLSFiles) (credentials.TransportCredentials, error) {
	if files.CAFile == "" {
		if files.CertFile != "" || files.KeyFile != "" {
			return nil, errors.New("a client certificate needs the Relay CA file too")
		}
		return insecure.NewCredentials(), nil
	}

	ca, err := os.ReadFile(files.CAFile)
	if err != nil {
		return nil, fmt.Errorf("read Relay CA file: %w", err)
	}
	pool := x509.NewCertPool()
	if !pool.AppendCertsFromPEM(ca) {
		return nil, fmt.Errorf("no certificates found in %s", files.CAFile)
	}
	config := &tls.Config{RootCAs: pool, ServerName: files.ServerName, MinVersion: tls.VersionTLS12}

	if (files.CertFile == "") != (files.KeyFile == "") {
		return nil, errors.New("the client certificate and key files must be set together")
	}
	if files.CertFile != "" {
		// Read on every handshake, so a rotated certificate is picked up without a restart.
		config.GetClientCertificate = func(*tls.CertificateRequestInfo) (*tls.Certificate, error) {
			cert, err := tls.LoadX509KeyPair(files.CertFile, files.KeyFile)
			if err != nil {
				return nil, fmt.Errorf("load Relay client certificate: %w", err)
			}
			return &cert, nil
		}
	}
	return credentials.NewTLS(config), nil
}

// Cilium's monitor event types and trace checkpoints, which Hubble's event type filter
// takes as numbers. They are the values of MessageTypeDrop, MessageTypeTrace, TraceToLxc,
// TraceToStack, TraceFromLxc and TraceToNetwork in github.com/cilium/cilium/pkg/monitor/api.
// That package isn't imported: on Linux it pulls the Cilium agent's dependencies into
// this binary, about 110 more modules.
const (
	messageTypeDrop  int32 = 1
	messageTypeTrace int32 = 4

	traceToEndpoint   int32 = 0
	traceToStack      int32 = 3
	traceFromEndpoint int32 = 5
	traceToNetwork    int32 = 11
)

func traceAt(checkpoint int32) *flowpb.EventTypeFilter {
	return &flowpb.EventTypeFilter{Type: messageTypeTrace, MatchSubType: true, SubType: checkpoint}
}

// podFilters selects the flows that a namespace's pods sent or received, or only one
// pod's when pod is set.
//
// Inside the cluster a connection is read where it's delivered to a pod or dropped.
// Traffic leaving the cluster is never delivered to a pod, so it's read where it's
// sent. Which checkpoint that is depends on Cilium's settings, so all three are asked
// for, but only for traffic to the world. That way a Service IP seen before translation
// can't add a second copy of a connection inside the cluster.
//
// Hubble's pod filter matches name prefixes, so for web-1 it also selects web-10, whose
// flows would count toward the limit and could leave none for web-1. For one pod, a CEL
// expression keeps only that pod. Cilium checks it after the pod filter, so it only runs
// on the flows that one matched. Cilium 1.15 and older have no CEL filter and ignore it,
// and involvesPod leaves the other pods out instead.
func podFilters(namespace, pod string) []*flowpb.FlowFilter {
	inCluster := []*flowpb.EventTypeFilter{
		{Type: messageTypeDrop},
		traceAt(traceToEndpoint),
	}
	leaving := []*flowpb.EventTypeFilter{
		traceAt(traceFromEndpoint),
		traceAt(traceToStack),
		traceAt(traceToNetwork),
	}
	name := namespace + "/" + pod
	return []*flowpb.FlowFilter{
		{SourcePod: []string{name}, EventType: inCluster, Experimental: onlyPod("source", pod)},
		{DestinationPod: []string{name}, EventType: inCluster, Experimental: onlyPod("destination", pod)},
		{SourcePod: []string{name}, DestinationLabel: worldLabels(), EventType: leaving, Experimental: onlyPod("source", pod)},
	}
}

// onlyPod is a CEL filter that keeps the flows whose end, "source" or "destination", is
// the pod itself, or nil when pod is empty. The server only accepts Kubernetes pod
// names, which can't contain a quote or a backslash, so the name can't end the string.
func onlyPod(end, pod string) *flowpb.FlowFilter_Experimental {
	if pod == "" {
		return nil
	}
	return &flowpb.FlowFilter_Experimental{
		CelExpression: []string{fmt.Sprintf("_flow.%s.pod_name == %q", end, pod)},
	}
}

// worldLabels are the labels of traffic outside the cluster. Relay matches them as
// label selectors, not prefixes, and dual-stack clusters use reserved:world-ipv4 and
// reserved:world-ipv6 instead of reserved:world.
func worldLabels() []string {
	return []string{"reserved:world", "reserved:world-ipv4", "reserved:world-ipv6"}
}

// nodeFlows is what one node sent for a query.
type nodeFlows struct {
	// count is how many flows it sent, also ones of other pods that were left out.
	count uint64
	// oldest is the time of the oldest of them.
	oldest time.Time
}

// coveredByEveryNode drops the flows older than the time every node that sent flows
// still covers. Each node keeps its own recent flows, so a busy node remembers less
// time than a quiet one, and a node that sent as many flows as it was asked for may
// have older ones it didn't send. Before that time only the quiet node's side of a
// connection is left, without the drops and the requests the busy node recorded, so
// the same traffic would look different there. When a node's oldest flow can't be
// read, the snapshot is returned as it is.
func (r *Relay) coveredByEveryNode(ctx context.Context, snapshot Snapshot, sent map[string]*nodeFlows, limit uint64) Snapshot {
	if len(sent) < 2 {
		return snapshot
	}

	var since time.Time
	cover := func(from time.Time) {
		if from.After(since) {
			since = from
		}
	}
	var unknown []string
	for node, flows := range sent {
		if flows.count >= limit {
			cover(flows.oldest)
		} else {
			unknown = append(unknown, node)
		}
	}
	if len(unknown) > 0 {
		oldest, err := r.oldestFlowTimes(ctx)
		if err != nil {
			return snapshot
		}
		for _, node := range unknown {
			at, ok := oldest[node]
			if !ok {
				// Relay couldn't read that node.
				return snapshot
			}
			cover(at)
		}
	}
	if since.IsZero() {
		return snapshot
	}

	covered := snapshot.Flows[:0]
	for _, flow := range snapshot.Flows {
		if !flow.Time.Before(since) {
			covered = append(covered, flow)
		}
	}
	snapshot.Flows = covered
	return snapshot
}

// oldestFlowTimes returns the time of the oldest flow each node still keeps. Relay asks
// every node it's connected to for the request's number of flows, and a node filter
// only filters the flows each node sends, so asking for one first flow without a filter
// gets one flow from each node in a single request. A node Relay couldn't read is
// missing from the result.
func (r *Relay) oldestFlowTimes(ctx context.Context) (map[string]time.Time, error) {
	mask := &fieldmaskpb.FieldMask{Paths: []string{"time", "node_name"}}
	experimental, err := experimentalFieldMask(mask)
	if err != nil {
		return nil, err
	}
	stream, err := r.client.GetFlows(ctx, &observerpb.GetFlowsRequest{
		Number:       1,
		First:        true,
		FieldMask:    mask,
		Experimental: experimental,
	})
	if err != nil {
		return nil, err
	}
	oldest := map[string]time.Time{}
	for {
		response, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			return oldest, nil
		}
		if err != nil {
			return nil, err
		}
		flow := response.GetFlow()
		if flow == nil || flow.GetNodeName() == "" {
			continue
		}
		at := flow.GetTime().AsTime()
		if known, ok := oldest[flow.GetNodeName()]; !ok || at.Before(known) {
			oldest[flow.GetNodeName()] = at
		}
	}
}

// experimentalFieldMask puts the field mask where Cilium 1.14 and 1.15 read it:
// experimental.field_mask, field 1. Cilium 1.16 moved it to the top-level field_mask,
// 1.16 to 1.18 read both, and 1.19 removed the old field from its API, so it's written
// as raw protobuf here. Sending both works on every version: each reads the one it
// knows. Cilium 1.13 and older have neither and send whole flows, which still works.
func experimentalFieldMask(mask *fieldmaskpb.FieldMask) (*observerpb.GetFlowsRequest_Experimental, error) {
	encoded, err := proto.Marshal(mask)
	if err != nil {
		return nil, fmt.Errorf("encode the field mask: %w", err)
	}
	raw := protowire.AppendTag(nil, legacyFieldMaskNumber, protowire.BytesType)
	raw = protowire.AppendBytes(raw, encoded)
	experimental := &observerpb.GetFlowsRequest_Experimental{}
	experimental.ProtoReflect().SetUnknown(raw)
	return experimental, nil
}

// legacyFieldMaskNumber is the number of experimental.field_mask in Cilium 1.14 to 1.18.
const legacyFieldMaskNumber protowire.Number = 1

// involvesPod reports whether one end of the flow is the pod, or always when pod is
// empty. Cilium 1.15 and older ignore the CEL filter of podFilters, and their pod
// filter matches name prefixes, so asking them for "web-1" also returns the flows of
// "web-10".
func involvesPod(flow Flow, namespace, pod string) bool {
	if pod == "" {
		return true
	}
	return (flow.Source.Namespace == namespace && flow.Source.Pod == pod) ||
		(flow.Destination.Namespace == namespace && flow.Destination.Pod == pod)
}

// Flows returns up to limit of the most recent flows of a namespace's pods, or of one
// pod when pod is set, oldest first. It's a snapshot, not a stream: it ends when Relay
// has sent what it has.
func (r *Relay) Flows(ctx context.Context, namespace, pod string, limit uint64) (Snapshot, error) {
	mask := &fieldmaskpb.FieldMask{Paths: flowFields}
	experimental, err := experimentalFieldMask(mask)
	if err != nil {
		return Snapshot{}, err
	}
	// Relay asks every node for limit flows and sends on what they all sent.
	stream, err := r.client.GetFlows(ctx, &observerpb.GetFlowsRequest{
		Number:       limit,
		Whitelist:    podFilters(namespace, pod),
		FieldMask:    mask,
		Experimental: experimental,
	})
	if err != nil {
		return Snapshot{}, err
	}

	var (
		snapshot Snapshot
		newest   = &newestFlows{limit: limit}
		sent     = map[string]*nodeFlows{}
		answered bool
	)
	for {
		response, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return Snapshot{}, err
		}
		answered = true
		// Relay still answers when it can't reach some nodes, without their flows.
		if node := response.GetNodeStatus(); node != nil {
			switch node.GetStateChange() {
			case relaypb.NodeState_NODE_UNAVAILABLE, relaypb.NodeState_NODE_ERROR:
				snapshot.UnreadNodes = append(snapshot.UnreadNodes, node.GetNodeNames()...)
			}
			continue
		}
		if lost := response.GetLostEvents(); lost != nil {
			snapshot.LostEvents += lost.GetNumEventsLost()
			continue
		}
		hubbleFlow := response.GetFlow()
		if hubbleFlow == nil {
			continue
		}
		if name := hubbleFlow.GetNodeName(); name != "" {
			node := sent[name]
			if node == nil {
				node = &nodeFlows{}
				sent[name] = node
			}
			node.count++
			if at := hubbleFlow.GetTime().AsTime(); node.oldest.IsZero() || at.Before(node.oldest) {
				node.oldest = at
			}
		}
		if flow, ok := fromHubble(hubbleFlow); ok && involvesPod(flow, namespace, pod) {
			newest.add(flow)
		}
	}
	// A Relay that isn't connected to any node ends the stream without a word, not even
	// about nodes it couldn't read.
	if !answered {
		return Snapshot{}, status.Error(codes.Unavailable, "Hubble Relay isn't connected to any Cilium node")
	}
	slices.Sort(snapshot.UnreadNodes)
	snapshot.UnreadNodes = slices.Compact(snapshot.UnreadNodes)
	snapshot.Flows = newest.sorted()
	return r.coveredByEveryNode(ctx, snapshot, sent, limit), nil
}

// newestFlows keeps the newest flows, up to limit, with the oldest at the top of the
// heap. Holding only those keeps the adapter's memory the same with many nodes.
type newestFlows struct {
	limit uint64
	items []arrivedFlow
	added uint64
}

// arrivedFlow is a flow and when it arrived, so flows of the same time keep Relay's order.
type arrivedFlow struct {
	flow  Flow
	order uint64
}

// before orders flows by time, and flows of the same time by when they arrived.
func before(a, b arrivedFlow) bool {
	if !a.flow.Time.Equal(b.flow.Time) {
		return a.flow.Time.Before(b.flow.Time)
	}
	return a.order < b.order
}

func (n *newestFlows) Len() int           { return len(n.items) }
func (n *newestFlows) Less(i, j int) bool { return before(n.items[i], n.items[j]) }
func (n *newestFlows) Swap(i, j int)      { n.items[i], n.items[j] = n.items[j], n.items[i] }
func (n *newestFlows) Push(item any)      { n.items = append(n.items, item.(arrivedFlow)) }
func (n *newestFlows) Pop() any {
	last := n.items[len(n.items)-1]
	n.items = n.items[:len(n.items)-1]
	return last
}

// add keeps flow when it's among the newest limit flows so far.
func (n *newestFlows) add(flow Flow) {
	item := arrivedFlow{flow: flow, order: n.added}
	n.added++
	switch {
	case uint64(len(n.items)) < n.limit:
		heap.Push(n, item)
	case len(n.items) > 0 && before(n.items[0], item):
		n.items[0] = item
		heap.Fix(n, 0)
	}
}

// sorted returns the flows kept, oldest first.
func (n *newestFlows) sorted() []Flow {
	slices.SortFunc(n.items, func(a, b arrivedFlow) int {
		switch {
		case before(a, b):
			return -1
		case before(b, a):
			return 1
		}
		return 0
	})
	flows := make([]Flow, len(n.items))
	for i, item := range n.items {
		flows[i] = item.flow
	}
	return flows
}
