function getTimestamp() {
  const now = /* @__PURE__ */ new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()].map(String).map((chunk) => chunk.slice(0, 2)).map((chunk) => chunk.padStart(2, "0")).join(":");
}
export {
  getTimestamp
};
//# sourceMappingURL=getTimestamp.mjs.map