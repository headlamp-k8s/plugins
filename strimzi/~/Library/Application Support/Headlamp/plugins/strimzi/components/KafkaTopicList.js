"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaTopicList = KafkaTopicList;
const react_1 = __importDefault(require("react"));
const crds_1 = require("../crds");
function KafkaTopicList() {
    const [topics, setTopics] = react_1.default.useState([]);
    const [error, setError] = react_1.default.useState(null);
    react_1.default.useEffect(() => {
        fetch('/apis/kafka.strimzi.io/v1beta2/kafkatopics')
            .then(res => res.json())
            .then(data => {
            if (data.items) {
                setTopics(data.items);
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
        react_1.default.createElement("h1", null, "Kafka Topics"),
        react_1.default.createElement("p", null, "Strimzi Kafka topics"),
        topics.length === 0 ? (react_1.default.createElement("p", null, "No Kafka topics found")) : (react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' } },
            react_1.default.createElement("thead", null,
                react_1.default.createElement("tr", { style: { borderBottom: '2px solid #ddd', textAlign: 'left' } },
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Name"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Namespace"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Partitions"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Replicas"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Status"))),
            react_1.default.createElement("tbody", null, topics.map((topic) => {
                const ready = (0, crds_1.isTopicReady)(topic);
                return (react_1.default.createElement("tr", { key: `${topic.metadata.namespace}/${topic.metadata.name}`, style: { borderBottom: '1px solid #eee' } },
                    react_1.default.createElement("td", { style: { padding: '12px' } }, topic.metadata.name),
                    react_1.default.createElement("td", { style: { padding: '12px' } }, topic.metadata.namespace),
                    react_1.default.createElement("td", { style: { padding: '12px' } }, topic.spec.partitions || 'N/A'),
                    react_1.default.createElement("td", { style: { padding: '12px' } }, topic.spec.replicas || 'N/A'),
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
//# sourceMappingURL=KafkaTopicList.js.map