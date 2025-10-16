"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KafkaUserList = KafkaUserList;
const react_1 = __importDefault(require("react"));
const crds_1 = require("../crds");
function KafkaUserList() {
    const [users, setUsers] = react_1.default.useState([]);
    const [error, setError] = react_1.default.useState(null);
    react_1.default.useEffect(() => {
        fetch('/apis/kafka.strimzi.io/v1beta2/kafkausers')
            .then(res => res.json())
            .then(data => {
            if (data.items) {
                setUsers(data.items);
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
        react_1.default.createElement("h1", null, "Kafka Users"),
        react_1.default.createElement("p", null, "Strimzi Kafka users"),
        users.length === 0 ? (react_1.default.createElement("p", null, "No Kafka users found")) : (react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', marginTop: '20px' } },
            react_1.default.createElement("thead", null,
                react_1.default.createElement("tr", { style: { borderBottom: '2px solid #ddd', textAlign: 'left' } },
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Name"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Namespace"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Authentication"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Authorization"),
                    react_1.default.createElement("th", { style: { padding: '12px' } }, "Status"))),
            react_1.default.createElement("tbody", null, users.map((user) => {
                const ready = (0, crds_1.isUserReady)(user);
                return (react_1.default.createElement("tr", { key: `${user.metadata.namespace}/${user.metadata.name}`, style: { borderBottom: '1px solid #eee' } },
                    react_1.default.createElement("td", { style: { padding: '12px' } }, user.metadata.name),
                    react_1.default.createElement("td", { style: { padding: '12px' } }, user.metadata.namespace),
                    react_1.default.createElement("td", { style: { padding: '12px' } }, user.spec.authentication.type),
                    react_1.default.createElement("td", { style: { padding: '12px' } }, user.spec.authorization?.type || 'None'),
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
//# sourceMappingURL=KafkaUserList.js.map