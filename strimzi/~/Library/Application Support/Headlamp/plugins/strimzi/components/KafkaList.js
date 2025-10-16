"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaList = KafkaList;
const react_1 = __importDefault(require("react"));
const crds_1 = require("../crds");
function KafkaList() {
    const [kafkas, setKafkas] = react_1.default.useState([]);
    const [error, setError] = react_1.default.useState(null);
    react_1.default.useEffect(() => {
        // Fetch Kafka resources from Kubernetes API
        fetch('/apis/kafka.strimzi.io/v1beta2/kafkas')
            .then(res => res.json())
            .then(data => {
            if (data.items) {
                setKafkas(data.items);
            }
        })
            .catch(err => {
            setError(err.message);
        });
    }, []);
    if (error) {
        return react_1.default.createElement("div", { style: { padding: '20px', color: 'red' } },
            "Error: ",
            error);
    }
    return (react_1.default.createElement("div", { style: { padding: '20px' } },
        react_1.default.createElement("h1", null, "Kafka Clusters"),
        react_1.default.createElement("p", null, "Strimzi Kafka clusters with KRaft and ZooKeeper support"),
        kafkas.length === 0 ? (react_1.default.createElement("p", null, "No Kafka clusters found")) : (react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' } },
            react_1.default.createElement("thead", null,
                react_1.default.createElement("tr", { style: { borderBottom: '2px solid #ddd', textAlign: 'left' } },
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Name"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Namespace"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Mode"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Version"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Replicas"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Status"))),
            react_1.default.createElement("tbody", null, kafkas.map((kafka) => {
                const mode = (0, crds_1.getClusterMode)(kafka);
                const isKRaft = (0, crds_1.isKRaftMode)(kafka);
                const ready = (0, crds_1.isKafkaReady)(kafka);
                return (react_1.default.createElement("tr", { key: `${kafka.metadata.namespace}/${kafka.metadata.name}`, style: { borderBottom: '1px solid #eee' } },
                    react_1.default.createElement("td", { style: { padding: '12px' } }, kafka.metadata.name),
                    react_1.default.createElement("td", { style: { padding: '12px' } }, kafka.metadata.namespace),
                    react_1.default.createElement("td", { style: { padding: '12px' } },
                        react_1.default.createElement("span", { style: {
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: isKRaft ? '#4caf50' : '#2196f3',
                                color: 'white',
                                fontSize: '12px'
                            } }, mode)),
                    react_1.default.createElement("td", { style: { padding: '12px' } }, kafka.spec.kafka.version || 'N/A'),
                    react_1.default.createElement("td", { style: { padding: '12px' } }, kafka.spec.kafka.replicas),
                    react_1.default.createElement("td", { style: { padding: '12px' } },
                        react_1.default.createElement("span", { style: {
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: ready ? '#4caf50' : '#ff9800',
                                color: 'white',
                                fontSize: '12px'
                            } }, ready ? 'Ready' : 'Not Ready'))));
            }))))));
}
//# sourceMappingURL=KafkaList.js.map