# Local evaluation (requires kubectl and a disposable cluster)

Apply `kubectl apply -f evaluation.yaml`, wait for all three Deployments in
`logging` to become ready, then `kubectl apply -f emitter.yaml`.
This intentionally uses emptyDir: restarting Loki can lose history. Do not
deploy it as a production log archive. Only the collector receives ingestion
privileges; the gateway serves one read-only query endpoint.

Configure the plugin: logging / loki-gateway / 80, cluster value evaluation-a.
Search default namespace, Pod historical-emitter, last 15 minutes.
Wait until HEADLAMP_HISTORY_EVIDENCE messages appear before deleting the Pod:
`kubectl delete pod historical-emitter`. Repeat the search and record the exact
marker and time range retrieved after deletion. Save screenshots before/after.

Authorization checks (run as a cluster admin with impersonation permission):
```sh
kubectl --as=system:serviceaccount:logging:history-reader get --raw '/api/v1/namespaces/logging/services/http:loki-gateway:80/proxy/loki/api/v1/query_range?query=%7Bcluster%3D%22evaluation-a%22%7D&limit=1'
kubectl --as=system:serviceaccount:logging:history-denied get --raw '/api/v1/namespaces/logging/services/http:loki-gateway:80/proxy/loki/api/v1/query_range?query=%7Bcluster%3D%22evaluation-a%22%7D&limit=1'
kubectl --as=system:serviceaccount:logging:history-reader get --raw '/api/v1/namespaces/logging/services/http:loki-gateway:80/proxy/loki/api/v1/push'
```
The reader query should succeed, the unbound identity should receive Kubernetes
403, and the forbidden gateway path should receive upstream 403. Test the
same access using actual Headlamp login credentials before claiming live UI
authorization. Both Kubernetes RBAC and the read-only gateway are necessary.

For two clusters: deploy independently; change evaluation-a to evaluation-b in
the second Alloy config, restart Alloy there, and configure each Headlamp context
with its own exact stored cluster value. Emit distinct markers under identical
namespace/Pod names. Verify no crossing and switch clusters while a query runs.
These commands are test instructions, not evidence that the tests have run.

Record: Headlamp, Kubernetes, Loki and collector versions; context names; unique
markers; query windows; HTTP statuses; requested limits; rows rendered; requests
per action. Cleanup with `kubectl delete -f emitter.yaml -f evaluation.yaml`.
