# Storybook mockups and local testing (Minikube)

## Where the existing Storybooks are

**In this repo (other plugins):**

- **cert-manager** – `src/components/**/List.stories.tsx`, `Detail.stories.tsx`, `CommonComponents.stories.tsx` (pure components + mock data)
- **minikube** – `src/CommandCluster/CommandDialog.stories.tsx` (real component + Redux Provider)
- **plugin-catalog** – `src/components/plugins/*.stories.tsx` (List, Detail, PluginCard, etc.)
- **prometheus** – `src/components/Chart/chart.stories.tsx`, `VisibilityButton.stories.tsx`
- **opencost** – `src/details.stories.tsx`
- **app-catalog** – `src/components/charts/*.stories.tsx`, `releases/ReleaseList.stories.tsx`
- **backstage** – `src/components/**/*Pure.stories.tsx`

**Strimzi:** there are no `.stories.tsx` files yet. You can add them next to your components (e.g. `KafkaList.stories.tsx` beside `KafkaList.tsx`).

---

## Run Storybook (no cluster – mocks only)

Storybook runs **inside the plugin** and does **not** talk to a real cluster. You use mock data so you can develop and review UI without Minikube.

```bash
cd plugins/strimzi
npm install
npm run storybook
```

Browser opens (e.g. http://localhost:6006). Once you add stories, they appear in the sidebar under the title you give (e.g. `strimzi/KafkaList`).

- **Add stories:** create `*.stories.tsx` next to your components. See cert-manager’s `List.stories.tsx` for a “pure component + mock list” pattern, or minikube’s `CommandDialog.stories.tsx` for wrapping with Redux/Provider.
- **Mock data:** define fake Kafka/KafkaTopic/KafkaUser objects that match your interfaces and pass them as story `args`.

---

## See the plugin in a Minikube cluster (real data)

To see the Strimzi plugin against a **real cluster** (Minikube with Strimzi):

### 1. Start Minikube and install Strimzi

```bash
minikube start
kubectl create namespace kafka
# Install Strimzi operator (example – adjust version/URL as needed)
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
# Optional: deploy a Kafka cluster
kubectl apply -f https://raw.githubusercontent.com/strimzi/strimzi-kafka-operator/main/examples/kafka/kafka-ephemeral.yaml -n kafka
```

### 2. Run Headlamp with the Strimzi plugin

**Option A – Headlamp Desktop**

1. Build the plugin:
   ```bash
   cd plugins/strimzi && npm run build
   ```
2. Copy `dist/*` into Headlamp’s plugin dir (see README “Testing Locally – Method 1” for paths).
3. Start Headlamp Desktop and point it at the cluster (e.g. add Minikube context and select it).
4. Open the Strimzi sidebar item and use Kafka/Topics/Users against the cluster.

**Option B – Headlamp from source (development)**

```bash
# In Headlamp main repo
export HEADLAMP_PLUGINS_DIR=/path/to/plugins/strimzi/dist
make run-frontend
# Configure kubeconfig to use minikube; open app and go to Strimzi
```

**Option C – Headlamp server**

```bash
headlamp-server -plugins-dir=/path/to/plugins/strimzi/dist
# Use the URL it prints; kubeconfig must point at minikube
```

---

## Suggested order

1. **Run Storybook** – `cd strimzi && npm run storybook` (will be empty until you add stories).
2. **Add one story** – e.g. `KafkaList.stories.tsx` with mock Kafka items (empty list, 1 cluster, 3 clusters) so you can see list UI without a cluster.
3. **Start Minikube + Strimzi** – when you want to test against real CRs, use the steps above and open Headlamp with the plugin loaded.

Storybook = fast UI iteration with mocks. Minikube + Headlamp = full integration with the real cluster.
