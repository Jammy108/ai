'use client'
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
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

// react/index.ts
var react_exports = {};
__export(react_exports, {
  Tokens: () => Tokens,
  useChat: () => useChat,
  useCompletion: () => useCompletion
});
module.exports = __toCommonJS(react_exports);

// react/use-chat.ts
var import_react = require("react");
var import_mutation = __toESM(require("swr/mutation"));
var import_swr = __toESM(require("swr"));

// shared/utils.ts
var import_nanoid = require("nanoid");
var nanoid = (0, import_nanoid.customAlphabet)(
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

// react/use-chat.ts
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
  const hookId = (0, import_react.useId)();
  const chatId = id || hookId;
  const { data, mutate } = (0, import_swr.default)([api, chatId], null, {
    fallbackData: initialMessages
  });
  const messages = data;
  const messagesRef = (0, import_react.useRef)(messages);
  (0, import_react.useEffect)(() => {
    messagesRef.current = messages;
  }, [messages]);
  const abortControllerRef = (0, import_react.useRef)(null);
  const extraMetadataRef = (0, import_react.useRef)({
    headers,
    body
  });
  (0, import_react.useEffect)(() => {
    extraMetadataRef.current = {
      headers,
      body
    };
  }, [headers, body]);
  const { error, trigger, isMutating } = (0, import_mutation.default)(
    [api, chatId],
    (_0, _1) => __async(this, [_0, _1], function* (_, { arg }) {
      try {
        const { messages: messagesSnapshot, options } = arg;
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const previousMessages = messagesRef.current;
        mutate(messagesSnapshot, false);
        const res = yield fetch(api, {
          method: "POST",
          body: JSON.stringify(__spreadValues(__spreadValues({
            messages: sendExtraMessageFields ? messagesSnapshot : messagesSnapshot.map(({ role, content }) => ({
              role,
              content
            }))
          }, extraMetadataRef.current.body), options == null ? void 0 : options.body)),
          headers: __spreadValues(__spreadValues({}, extraMetadataRef.current.headers), options == null ? void 0 : options.headers),
          signal: abortController.signal
        }).catch((err) => {
          mutate(previousMessages, false);
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
          mutate(previousMessages, false);
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
        const decode = createChunkDecoder();
        while (true) {
          const { done, value } = yield reader.read();
          if (done) {
            break;
          }
          result += decode(value);
          mutate(
            [
              ...messagesSnapshot,
              {
                id: replyId,
                createdAt,
                content: result,
                role: "assistant"
              }
            ],
            false
          );
          if (abortControllerRef.current === null) {
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
        abortControllerRef.current = null;
        return result;
      } catch (err) {
        if (err.name === "AbortError") {
          abortControllerRef.current = null;
          return null;
        }
        if (onError && err instanceof Error) {
          onError(err);
        }
        throw err;
      }
    }),
    {
      populateCache: false,
      revalidate: false
    }
  );
  const append = (0, import_react.useCallback)(
    (message, options) => __async(this, null, function* () {
      if (!message.id) {
        message.id = nanoid();
      }
      return trigger({
        messages: messagesRef.current.concat(message),
        options
      });
    }),
    [trigger]
  );
  const reload = (0, import_react.useCallback)(
    (options) => __async(this, null, function* () {
      if (messagesRef.current.length === 0)
        return null;
      const lastMessage = messagesRef.current[messagesRef.current.length - 1];
      if (lastMessage.role === "assistant") {
        return trigger({
          messages: messagesRef.current.slice(0, -1),
          options
        });
      }
      return trigger({
        messages: messagesRef.current,
        options
      });
    }),
    [trigger]
  );
  const stop = (0, import_react.useCallback)(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  const setMessages = (0, import_react.useCallback)(
    (messages2) => {
      mutate(messages2, false);
      messagesRef.current = messages2;
    },
    [mutate]
  );
  const [input, setInput] = (0, import_react.useState)(initialInput);
  const handleSubmit = (0, import_react.useCallback)(
    (e, metadata) => {
      if (metadata) {
        extraMetadataRef.current = __spreadValues(__spreadValues({}, extraMetadataRef.current), metadata);
      }
      e.preventDefault();
      if (!input)
        return;
      append({
        content: input,
        role: "user",
        createdAt: /* @__PURE__ */ new Date()
      });
      setInput("");
    },
    [input, append]
  );
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  return {
    messages,
    error,
    append,
    reload,
    stop,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: isMutating
  };
}

// react/use-completion.ts
var import_react2 = require("react");
var import_mutation2 = __toESM(require("swr/mutation"));
var import_swr2 = __toESM(require("swr"));
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
  const hookId = (0, import_react2.useId)();
  const completionId = id || hookId;
  const { data, mutate } = (0, import_swr2.default)([api, completionId], null, {
    fallbackData: initialCompletion
  });
  const completion = data;
  const [abortController, setAbortController] = (0, import_react2.useState)(null);
  const extraMetadataRef = (0, import_react2.useRef)({
    headers,
    body
  });
  (0, import_react2.useEffect)(() => {
    extraMetadataRef.current = {
      headers,
      body
    };
  }, [headers, body]);
  const { error, trigger, isMutating } = (0, import_mutation2.default)(
    [api, completionId],
    (_0, _1) => __async(this, [_0, _1], function* (_, { arg }) {
      try {
        const { prompt, options } = arg;
        const abortController2 = new AbortController();
        setAbortController(abortController2);
        mutate("", false);
        const res = yield fetch(api, {
          method: "POST",
          body: JSON.stringify(__spreadValues(__spreadValues({
            prompt
          }, extraMetadataRef.current.body), options == null ? void 0 : options.body)),
          headers: __spreadValues(__spreadValues({}, extraMetadataRef.current.headers), options == null ? void 0 : options.headers),
          signal: abortController2.signal
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
          mutate(result, false);
          if (abortController2 === null) {
            reader.cancel();
            break;
          }
        }
        if (onFinish) {
          onFinish(prompt, result);
        }
        setAbortController(null);
        return result;
      } catch (err) {
        if (err.name === "AbortError") {
          setAbortController(null);
          return null;
        }
        if (onError && err instanceof Error) {
          onError(err);
        }
        throw err;
      }
    }),
    {
      populateCache: false,
      revalidate: false
    }
  );
  const stop = (0, import_react2.useCallback)(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  }, [abortController]);
  const setCompletion = (0, import_react2.useCallback)(
    (completion2) => {
      mutate(completion2, false);
    },
    [mutate]
  );
  const complete = (0, import_react2.useCallback)(
    (prompt, options) => __async(this, null, function* () {
      return trigger({
        prompt,
        options
      });
    }),
    [trigger]
  );
  const [input, setInput] = (0, import_react2.useState)(initialInput);
  const handleSubmit = (0, import_react2.useCallback)(
    (e) => {
      e.preventDefault();
      if (!input)
        return;
      return complete(input);
    },
    [input, complete]
  );
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  return {
    completion,
    complete,
    error,
    setCompletion,
    stop,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: isMutating
  };
}

// react/tokens.tsx
var import_react3 = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function Tokens(props) {
  return __async(this, null, function* () {
    const { stream } = props;
    const reader = stream.getReader();
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react3.Suspense, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecursiveTokens, { reader }) });
  });
}
function RecursiveTokens(_0) {
  return __async(this, arguments, function* ({ reader }) {
    const { done, value } = yield reader.read();
    if (done) {
      return null;
    }
    const text = new TextDecoder().decode(value);
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      text,
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react3.Suspense, { fallback: null, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecursiveTokens, { reader }) })
    ] });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Tokens,
  useChat,
  useCompletion
});
