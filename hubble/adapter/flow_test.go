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
	"reflect"
	"testing"
	"time"

	flowpb "github.com/cilium/cilium/api/v1/flow"
	"google.golang.org/protobuf/types/known/timestamppb"
	"google.golang.org/protobuf/types/known/wrapperspb"
)

var seenAt = time.Date(2026, 11, 7, 10, 30, 0, 0, time.UTC)

func tcpFlow() *flowpb.Flow {
	return &flowpb.Flow{
		Time:                  timestamppb.New(seenAt),
		NodeName:              "node-a",
		Verdict:               flowpb.Verdict_FORWARDED,
		TraceObservationPoint: flowpb.TraceObservationPoint_TO_ENDPOINT,
		IsReply:               wrapperspb.Bool(false),
		IP:                    &flowpb.IP{Source: "10.0.0.5", Destination: "10.0.0.9"},
		L4: &flowpb.Layer4{Protocol: &flowpb.Layer4_TCP{TCP: &flowpb.TCP{
			SourcePort:      41000,
			DestinationPort: 8080,
			Flags:           &flowpb.TCPFlags{SYN: true},
		}}},
		Source: &flowpb.Endpoint{
			Namespace: "shop",
			PodName:   "frontend-5d772",
			Labels:    []string{"k8s:app=frontend"},
			Workloads: []*flowpb.Workload{{Name: "frontend", Kind: "Deployment"}},
		},
		Destination: &flowpb.Endpoint{Namespace: "shop", PodName: "backend-0"},
	}
}

func TestFromHubbleTrimsATCPFlow(t *testing.T) {
	got, ok := fromHubble(tcpFlow())
	if !ok {
		t.Fatal("a flow with IP addresses was skipped")
	}
	isReply := false
	want := Flow{
		Time:             seenAt,
		Node:             "node-a",
		Verdict:          "FORWARDED",
		ObservationPoint: "TO_ENDPOINT",
		IsReply:          &isReply,
		Protocol:         "TCP",
		TCPFlags:         &TCPFlags{SYN: true},
		Source:           Peer{IP: "10.0.0.5", Port: 41000, Namespace: "shop", Pod: "frontend-5d772", Workload: "frontend"},
		Destination:      Peer{IP: "10.0.0.9", Port: 8080, Namespace: "shop", Pod: "backend-0"},
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %+v\nwant %+v", got, want)
	}
}

func TestFromHubbleKeepsAnUnknownDirectionUnset(t *testing.T) {
	flow := tcpFlow()
	flow.IsReply = nil
	got, _ := fromHubble(flow)
	if got.IsReply != nil {
		t.Errorf("IsReply = %v, want it left out", *got.IsReply)
	}
}

func TestFromHubbleReportsWhyAFlowWasDropped(t *testing.T) {
	flow := tcpFlow()
	flow.Verdict = flowpb.Verdict_DROPPED
	flow.DropReasonDesc = flowpb.DropReason_POLICY_DENIED
	got, _ := fromHubble(flow)
	if got.Verdict != "DROPPED" || got.DropReason != "POLICY_DENIED" {
		t.Errorf("got verdict %q and reason %q", got.Verdict, got.DropReason)
	}
}

func TestFromHubbleMarksTrafficOutsideTheCluster(t *testing.T) {
	for _, label := range []string{"reserved:world", "reserved:world-ipv4", "reserved:world-ipv6"} {
		flow := tcpFlow()
		flow.Destination = &flowpb.Endpoint{Labels: []string{label}}
		flow.DestinationNames = []string{"example.com"}
		got, _ := fromHubble(flow)
		if !got.Destination.Outside {
			t.Errorf("%s: destination not marked as outside", label)
		}
		if !reflect.DeepEqual(got.Destination.Names, []string{"example.com"}) {
			t.Errorf("%s: names = %v", label, got.Destination.Names)
		}
		if got.Source.Outside {
			t.Errorf("%s: a pod was marked as outside", label)
		}
	}
}

func TestFromHubbleNamesEndsThatAreNotPods(t *testing.T) {
	flow := tcpFlow()
	// What Cilium 1.20 gives the node's own address, which kubelet probes come from.
	flow.Source = &flowpb.Endpoint{Identity: 1, Labels: []string{"reserved:host", "reserved:kube-apiserver"}}
	got, _ := fromHubble(flow)
	if !reflect.DeepEqual(got.Source.Reserved, []string{"host", "kube-apiserver"}) {
		t.Errorf("Reserved = %v, want host and kube-apiserver", got.Source.Reserved)
	}
	if got.Source.Outside {
		t.Error("the node was marked as outside the cluster")
	}
	if got.Destination.Reserved != nil {
		t.Errorf("a pod got reserved identities %v", got.Destination.Reserved)
	}
}

func TestFromHubbleReadsOtherProtocols(t *testing.T) {
	cases := map[string]struct {
		l4       *flowpb.Layer4
		protocol string
		port     uint32
	}{
		"UDP":    {&flowpb.Layer4{Protocol: &flowpb.Layer4_UDP{UDP: &flowpb.UDP{SourcePort: 5000, DestinationPort: 53}}}, "UDP", 53},
		"SCTP":   {&flowpb.Layer4{Protocol: &flowpb.Layer4_SCTP{SCTP: &flowpb.SCTP{SourcePort: 5000, DestinationPort: 9000}}}, "SCTP", 9000},
		"ICMPv4": {&flowpb.Layer4{Protocol: &flowpb.Layer4_ICMPv4{ICMPv4: &flowpb.ICMPv4{Type: 8}}}, "ICMPv4", 0},
		"ICMPv6": {&flowpb.Layer4{Protocol: &flowpb.Layer4_ICMPv6{ICMPv6: &flowpb.ICMPv6{Type: 128}}}, "ICMPv6", 0},
		"none":   {nil, "unknown", 0},
	}
	for name, c := range cases {
		flow := tcpFlow()
		flow.L4 = c.l4
		got, _ := fromHubble(flow)
		if got.Protocol != c.protocol || got.Destination.Port != c.port || got.TCPFlags != nil {
			t.Errorf("%s: got protocol %q, port %d, flags %v", name, got.Protocol, got.Destination.Port, got.TCPFlags)
		}
	}
}

func TestFromHubbleSkipsFlowsWithoutIP(t *testing.T) {
	flow := tcpFlow()
	flow.IP = nil
	if _, ok := fromHubble(flow); ok {
		t.Error("a flow without IP addresses was kept")
	}
	if _, ok := fromHubble(nil); ok {
		t.Error("a missing flow was kept")
	}
}
