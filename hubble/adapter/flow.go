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
	"strings"
	"time"

	flowpb "github.com/cilium/cilium/api/v1/flow"
)

// worldLabelPrefix matches Cilium's labels for traffic outside the cluster:
// reserved:world, reserved:world-ipv4 and reserved:world-ipv6.
const worldLabelPrefix = "reserved:world"

// reservedLabelPrefix is the source of the labels Cilium gives ends that aren't pods.
const reservedLabelPrefix = "reserved:"

// flowFields are the Hubble flow fields the adapter reads. Relay leaves the rest out.
var flowFields = []string{
	"time",
	"node_name",
	"verdict",
	"drop_reason_desc",
	"trace_observation_point",
	"is_reply",
	"IP.source",
	"IP.destination",
	"l4",
	"source.namespace",
	"source.pod_name",
	"source.labels",
	"source.workloads",
	"destination.namespace",
	"destination.pod_name",
	"destination.labels",
	"destination.workloads",
	"source_names",
	"destination_names",
}

// Flow is the part of a Hubble flow the Headlamp plugin needs to tell connections apart.
type Flow struct {
	Time time.Time `json:"time"`
	// Node is the node that recorded the flow.
	Node    string `json:"node,omitempty"`
	Verdict string `json:"verdict"`
	// DropReason is set for dropped flows, like "POLICY_DENIED".
	DropReason string `json:"dropReason,omitempty"`
	// ObservationPoint is where on the node the flow was seen, like "TO_ENDPOINT".
	ObservationPoint string `json:"observationPoint"`
	// IsReply is left out when Hubble couldn't tell the direction.
	IsReply *bool `json:"isReply,omitempty"`
	// Protocol is "TCP", "UDP", "SCTP", "ICMPv4", "ICMPv6" or "unknown".
	Protocol    string    `json:"protocol"`
	TCPFlags    *TCPFlags `json:"tcpFlags,omitempty"`
	Source      Peer      `json:"source"`
	Destination Peer      `json:"destination"`
}

// TCPFlags are the flags the plugin uses to find where a connection starts and ends.
type TCPFlags struct {
	SYN bool `json:"syn,omitempty"`
	ACK bool `json:"ack,omitempty"`
	FIN bool `json:"fin,omitempty"`
	RST bool `json:"rst,omitempty"`
}

// Peer is one end of a flow.
type Peer struct {
	IP string `json:"ip"`
	// Port is 0 for protocols without ports.
	Port      uint32 `json:"port"`
	Namespace string `json:"namespace,omitempty"`
	Pod       string `json:"pod,omitempty"`
	// Workload is the Deployment, StatefulSet or similar that the pod belongs to.
	Workload string `json:"workload,omitempty"`
	// Names are the DNS names Hubble saw for this end.
	Names []string `json:"names,omitempty"`
	// Outside is true when this end is outside the cluster.
	Outside bool `json:"outside,omitempty"`
	// Reserved are Cilium's reserved identities of an end that isn't a pod, without the
	// "reserved:" prefix, like "host", "kube-apiserver", "remote-node" or "world".
	Reserved []string `json:"reserved,omitempty"`
}

// fromHubble trims a Hubble flow. It reports false for flows without IP addresses,
// which can't be matched to a connection.
func fromHubble(f *flowpb.Flow) (Flow, bool) {
	ip := f.GetIP()
	if ip == nil {
		return Flow{}, false
	}

	flow := Flow{
		Time:             f.GetTime().AsTime(),
		Node:             f.GetNodeName(),
		Verdict:          f.GetVerdict().String(),
		ObservationPoint: f.GetTraceObservationPoint().String(),
		Protocol:         "unknown",
		Source:           peer(f.GetSource(), ip.GetSource(), f.GetSourceNames()),
		Destination:      peer(f.GetDestination(), ip.GetDestination(), f.GetDestinationNames()),
	}
	if f.GetVerdict() == flowpb.Verdict_DROPPED {
		flow.DropReason = f.GetDropReasonDesc().String()
	}
	if reply := f.GetIsReply(); reply != nil {
		value := reply.GetValue()
		flow.IsReply = &value
	}

	switch l4 := f.GetL4().GetProtocol().(type) {
	case *flowpb.Layer4_TCP:
		flow.Protocol = "TCP"
		flow.Source.Port = l4.TCP.GetSourcePort()
		flow.Destination.Port = l4.TCP.GetDestinationPort()
		if flags := l4.TCP.GetFlags(); flags != nil {
			flow.TCPFlags = &TCPFlags{
				SYN: flags.GetSYN(),
				ACK: flags.GetACK(),
				FIN: flags.GetFIN(),
				RST: flags.GetRST(),
			}
		}
	case *flowpb.Layer4_UDP:
		flow.Protocol = "UDP"
		flow.Source.Port = l4.UDP.GetSourcePort()
		flow.Destination.Port = l4.UDP.GetDestinationPort()
	case *flowpb.Layer4_SCTP:
		flow.Protocol = "SCTP"
		flow.Source.Port = l4.SCTP.GetSourcePort()
		flow.Destination.Port = l4.SCTP.GetDestinationPort()
	case *flowpb.Layer4_ICMPv4:
		flow.Protocol = "ICMPv4"
	case *flowpb.Layer4_ICMPv6:
		flow.Protocol = "ICMPv6"
	}
	return flow, true
}

func peer(endpoint *flowpb.Endpoint, ip string, names []string) Peer {
	p := Peer{
		IP:        ip,
		Namespace: endpoint.GetNamespace(),
		Pod:       endpoint.GetPodName(),
		Names:     names,
	}
	if workloads := endpoint.GetWorkloads(); len(workloads) > 0 {
		p.Workload = workloads[0].GetName()
	}
	for _, label := range endpoint.GetLabels() {
		name, ok := strings.CutPrefix(label, reservedLabelPrefix)
		if !ok {
			continue
		}
		p.Reserved = append(p.Reserved, name)
		if strings.HasPrefix(label, worldLabelPrefix) {
			p.Outside = true
		}
	}
	return p
}
