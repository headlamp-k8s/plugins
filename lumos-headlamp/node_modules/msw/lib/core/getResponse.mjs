import { createRequestId } from "@mswjs/interceptors";
import { executeHandlers } from './utils/executeHandlers.mjs';
const getResponse = async (handlers, request) => {
  const result = await executeHandlers({
    request,
    requestId: createRequestId(),
    handlers
  });
  return result?.response;
};
export {
  getResponse
};
//# sourceMappingURL=getResponse.mjs.map