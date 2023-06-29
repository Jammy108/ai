'use client'
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

// react/use-chat.ts
import { useCallback, useId, useRef, useEffect, useState } from "react";
import useSWRMutation from "swr/mutation";
import useSWR from "swr";

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
  const hookId = useId();
  const chatId = id || hookId;
  const { data, mutate } = useSWR([api, chatId], null, {
    fallbackData: initialMessages
  });
  const messages = data;
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const abortControllerRef = useRef(null);
  const extraMetadataRef = useRef({
    headers,
    body
  });
  useEffect(() => {
    extraMetadataRef.current = {
      headers,
      body
    };
  }, [headers, body]);
  const { error, trigger, isMutating } = useSWRMutation(
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
  const append = useCallback(
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
  const reload = useCallback(
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
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  const setMessages = useCallback(
    (messages2) => {
      mutate(messages2, false);
      messagesRef.current = messages2;
    },
    [mutate]
  );
  const [input, setInput] = useState(initialInput);
  const handleSubmit = useCallback(
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
import { useCallback as useCallback2, useEffect as useEffect2, useId as useId2, useRef as useRef2, useState as useState2 } from "react";
import useSWRMutation2 from "swr/mutation";
import useSWR2 from "swr";
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
  const hookId = useId2();
  const completionId = id || hookId;
  const { data, mutate } = useSWR2([api, completionId], null, {
    fallbackData: initialCompletion
  });
  const completion = data;
  const [abortController, setAbortController] = useState2(null);
  const extraMetadataRef = useRef2({
    headers,
    body
  });
  useEffect2(() => {
    extraMetadataRef.current = {
      headers,
      body
    };
  }, [headers, body]);
  const { error, trigger, isMutating } = useSWRMutation2(
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
  const stop = useCallback2(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  }, [abortController]);
  const setCompletion = useCallback2(
    (completion2) => {
      mutate(completion2, false);
    },
    [mutate]
  );
  const complete = useCallback2(
    (prompt, options) => __async(this, null, function* () {
      return trigger({
        prompt,
        options
      });
    }),
    [trigger]
  );
  const [input, setInput] = useState2(initialInput);
  const handleSubmit = useCallback2(
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
import { Suspense } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Tokens(props) {
  return __async(this, null, function* () {
    const { stream } = props;
    const reader = stream.getReader();
    return /* @__PURE__ */ jsx(Suspense, { children: /* @__PURE__ */ jsx(RecursiveTokens, { reader }) });
  });
}
function RecursiveTokens(_0) {
  return __async(this, arguments, function* ({ reader }) {
    const { done, value } = yield reader.read();
    if (done) {
      return null;
    }
    const text = new TextDecoder().decode(value);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      text,
      /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(RecursiveTokens, { reader }) })
    ] });
  });
}
export {
  Tokens,
  useChat,
  useCompletion
};
