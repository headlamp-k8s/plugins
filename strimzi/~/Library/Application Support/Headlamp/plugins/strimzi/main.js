"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("@kinvolk/headlamp-plugin/lib");
const react_1 = __importDefault(require("react"));
const KafkaList_1 = require("./components/KafkaList");
const KafkaTopicList_1 = require("./components/KafkaTopicList");
const KafkaUserList_1 = require("./components/KafkaUserList");
// Register routes
(0, lib_1.registerRoute)({
    path: '/strimzi/kafkas',
    sidebar: 'strimzi',
    name: 'Kafka Clusters',
    component: () => react_1.default.createElement(KafkaList_1.KafkaList),
});
(0, lib_1.registerRoute)({
    path: '/strimzi/topics',
    sidebar: 'strimzi',
    name: 'Kafka Topics',
    component: () => react_1.default.createElement(KafkaTopicList_1.KafkaTopicList),
});
(0, lib_1.registerRoute)({
    path: '/strimzi/users',
    sidebar: 'strimzi',
    name: 'Kafka Users',
    component: () => react_1.default.createElement(KafkaUserList_1.KafkaUserList),
});
// Register sidebar entry
(0, lib_1.registerSidebarEntry)({
    parent: null,
    name: 'strimzi',
    label: 'Strimzi',
    url: '/strimzi/kafkas',
});
//# sourceMappingURL=main.js.map