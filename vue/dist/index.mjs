var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// vue/use-chat.ts
import swrv from "swrv";
import { ref } from "vue";

// shared/utils.ts
import { customAlphabet } from "nanoid";
var nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
);
function createChunkDecoder() {
  const decoder = new TextDecoder();
  return function(chunk) {
    if (!chunk)
      return "";
    return decoder.decode(chunk, { stream: true });
  };
}

// vue/use-chat.ts
var uniqueId = 0;
var useSWRV = swrv.default || swrv;
var store = {};
function useChat({
  api = "/api/chat",
  id,
  initialMessages = [],
  initialInput = "",
  sendExtraMessageFields,
  onResponse,
  onFinish,
  onError,
  headers,
  body
} = {}) {
  const chatId = id || `chat-${uniqueId++}`;
  const key = `${api}|${chatId}`;
  const { data, mutate: originalMutate } = useSWRV(
    key,
    () => store[key] || initialMessages
  );
  data.value || (data.value = initialMessages);
  const mutate = (data2) => {
    store[key] = data2;
    return originalMutate();
  };
  const messages = data;
  const error = ref(void 0);
  const isLoading = ref(false);
  let abortController = null;
  function triggerRequest(messagesSnapshot, options) {
    return __async(this, null, function* () {
      try {
        isLoading.value = true;
        abortController = new AbortController();
        const previousMessages = messages.value;
        mutate(messagesSnapshot);
        const res = yield fetch(api, {
          method: "POST",
          body: JSON.stringify(__spreadValues(__spreadValues({
            messages: sendExtraMessageFields ? messagesSnapshot : messagesSnapshot.map(({ role, content }) => ({
              role,
              content
            }))
          }, body), options == null ? void 0 : options.body)),
          headers: __spreadValues(__spreadValues({}, headers), options == null ? void 0 : options.headers),
          signal: abortController.signal
        }).catch((err) => {
          mutate(previousMessages);
          throw err;
        });
        if (onResponse) {
          try {
            yield onResponse(res);
          } catch (err) {
            throw err;
          }
        }
        if (!res.ok) {
          mutate(previousMessages);
          throw new Error(
            (yield res.text()) || "Failed to fetch the chat response."
          );
        }
        if (!res.body) {
          throw new Error("The response body is empty.");
        }
        let result = "";
        const createdAt = /* @__PURE__ */ new Date();
        const replyId = nanoid();
        const reader = res.body.getReader();
        const decoder = createChunkDecoder();
        while (true) {
          const { done, value } = yield reader.read();
          if (done) {
            break;
          }
          result += decoder(value);
          mutate([
            ...messagesSnapshot,
            {
              id: replyId,
              createdAt,
              content: result,
              role: "assistant"
            }
          ]);
          if (abortController === null) {
            reader.cancel();
            break;
          }
        }
        if (onFinish) {
          onFinish({
            id: replyId,
            createdAt,
            content: result,
            role: "assistant"
          });
        }
        abortController = null;
        return result;
      } catch (err) {
        if (err.name === "AbortError") {
          abortController = null;
          return null;
        }
        if (onError && err instanceof Error) {
          onError(err);
        }
        error.value = err;
      } finally {
        isLoading.value = false;
      }
    });
  }
  const append = (message, options) => __async(this, null, function* () {
    if (!message.id) {
      message.id = nanoid();
    }
    return triggerRequest(messages.value.concat(message), options);
  });
  const reload = (options) => __async(this, null, function* () {
    const messagesSnapshot = messages.value;
    if (messagesSnapshot.length === 0)
      return null;
    const lastMessage = messagesSnapshot[messagesSnapshot.length - 1];
    if (lastMessage.role === "assistant") {
      return triggerRequest(messagesSnapshot.slice(0, -1), options);
    }
    return triggerRequest(messagesSnapshot, options);
  });
  const stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };
  const setMessages = (messages2) => {
    mutate(messages2);
  };
  const input = ref(initialInput);
  const handleSubmit = (e) => {
    e.preventDefault();
    const inputValue = input.value;
    if (!inputValue)
      return;
    append({
      content: inputValue,
      role: "user"
    });
    input.value = "";
  };
  return {
    messages,
    append,
    error,
    reload,
    stop,
    setMessages,
    input,
    handleSubmit,
    isLoading
  };
}

// vue/use-completion.ts
import swrv2 from "swrv";
import { ref as ref2 } from "vue";
var uniqueId2 = 0;
var useSWRV2 = swrv2.default || swrv2;
var store2 = {};
function useCompletion({
  api = "/api/completion",
  id,
  initialCompletion = "",
  initialInput = "",
  headers,
  body,
  onResponse,
  onFinish,
  onError
} = {}) {
  const completionId = id || `completion-${uniqueId2++}`;
  const key = `${api}|${completionId}`;
  const { data, mutate: originalMutate } = useSWRV2(
    key,
    () => store2[key] || initialCompletion
  );
  data.value || (data.value = initialCompletion);
  const mutate = (data2) => {
    store2[key] = data2;
    return originalMutate();
  };
  const completion = data;
  const error = ref2(void 0);
  const isLoading = ref2(false);
  let abortController = null;
  function triggerRequest(prompt, options) {
    return __async(this, null, function* () {
      try {
        isLoading.value = true;
        abortController = new AbortController();
        mutate("");
        const res = yield fetch(api, {
          method: "POST",
          body: JSON.stringify(__spreadValues(__spreadValues({
            prompt
          }, body), options == null ? void 0 : options.body)),
          headers: __spreadValues(__spreadValues({}, headers), options == null ? void 0 : options.headers),
          signal: abortController.signal
        }).catch((err) => {
          throw err;
        });
        if (onResponse) {
          try {
            yield onResponse(res);
          } catch (err) {
            throw err;
          }
        }
        if (!res.ok) {
          throw new Error(
            (yield res.text()) || "Failed to fetch the chat response."
          );
        }
        if (!res.body) {
          throw new Error("The response body is empty.");
        }
        let result = "";
        const reader = res.body.getReader();
        const decoder = createChunkDecoder();
        while (true) {
          const { done, value } = yield reader.read();
          if (done) {
            break;
          }
          result += decoder(value);
          mutate(result);
          if (abortController === null) {
            reader.cancel();
            break;
          }
        }
        if (onFinish) {
          onFinish(prompt, result);
        }
        abortController = null;
        return result;
      } catch (err) {
        if (err.name === "AbortError") {
          abortController = null;
          return null;
        }
        if (onError && error instanceof Error) {
          onError(error);
        }
        error.value = err;
      } finally {
        isLoading.value = false;
      }
    });
  }
  const complete = (prompt, options) => __async(this, null, function* () {
    return triggerRequest(prompt, options);
  });
  const stop = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  };
  const setCompletion = (completion2) => {
    mutate(completion2);
  };
  const input = ref2(initialInput);
  const handleSubmit = (e) => {
    e.preventDefault();
    const inputValue = input.value;
    if (!inputValue)
      return;
    return complete(inputValue);
  };
  return {
    completion,
    complete,
    error,
    stop,
    setCompletion,
    input,
    handleSubmit,
    isLoading
  };
}
export {
  useChat,
  useCompletion
};
