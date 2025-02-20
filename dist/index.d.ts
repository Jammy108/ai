import { ServerResponse } from 'node:http';

/**
 * Helper callback methods for AIStream stream lifecycle events
 * @interface
 */
interface AIStreamCallbacks {
    onStart?: () => Promise<void>;
    onCompletion?: (completion: string) => Promise<void>;
    onToken?: (token: string) => Promise<void>;
}
/**
 * Custom parser for AIStream data.
 * @interface
 */
interface AIStreamParser {
    (data: string): string | void;
}
/**
 * Creates a TransformStream that parses events from an EventSource stream using a custom parser.
 * @param {AIStreamParser} customParser - Function to handle event data.
 * @returns {TransformStream<Uint8Array, string>} TransformStream parsing events.
 */
declare function createEventStreamTransformer(customParser: AIStreamParser): TransformStream<Uint8Array, string>;
/**
 * Creates a transform stream that encodes input messages and invokes optional callback functions.
 * The transform stream uses the provided callbacks to execute custom logic at different stages of the stream's lifecycle.
 * - `onStart`: Called once when the stream is initialized.
 * - `onToken`: Called for each tokenized message.
 * - `onCompletion`: Called once when the stream is flushed, with the aggregated messages.
 *
 * This function is useful when you want to process a stream of messages and perform specific actions during the stream's lifecycle.
 *
 * @param {AIStreamCallbacks} [callbacks] - An object containing the callback functions.
 * @return {TransformStream<string, Uint8Array>} A transform stream that encodes input messages as Uint8Array and allows the execution of custom logic through callbacks.
 *
 * @example
 * const callbacks = {
 *   onStart: async () => console.log('Stream started'),
 *   onToken: async (token) => console.log(`Token: ${token}`),
 *   onCompletion: async (completion) => console.log(`Completion: ${completion}`)
 * };
 * const transformer = createCallbacksTransformer(callbacks);
 */
declare function createCallbacksTransformer(callbacks: AIStreamCallbacks | undefined): TransformStream<string, Uint8Array>;
/**
 * Returns a stateful function that, when invoked, trims leading whitespace
 * from the input text. The trimming only occurs on the first invocation, ensuring that
 * subsequent calls do not alter the input text. This is particularly useful in scenarios
 * where a text stream is being processed and only the initial whitespace should be removed.
 *
 * @return {function(string): string} A function that takes a string as input and returns a string
 * with leading whitespace removed if it is the first invocation; otherwise, it returns the input unchanged.
 *
 * @example
 * const trimStart = trimStartOfStreamHelper();
 * const output1 = trimStart("   text"); // "text"
 * const output2 = trimStart("   text"); // "   text"
 *
 */
declare function trimStartOfStreamHelper(): (text: string) => string;
/**
 * Returns a ReadableStream created from the response, parsed and handled with custom logic.
 * The stream goes through two transformation stages, first parsing the events and then
 * invoking the provided callbacks.
 * @param {Response} response - The response.
 * @param {AIStreamParser} customParser - The custom parser function.
 * @param {AIStreamCallbacks} callbacks - The callbacks.
 * @return {ReadableStream} The AIStream.
 * @throws Will throw an error if the response is not OK.
 */
declare function AIStream(response: Response, customParser: AIStreamParser, callbacks?: AIStreamCallbacks): ReadableStream;

declare function OpenAIStream(res: Response, cb?: AIStreamCallbacks): ReadableStream;

/**
 * A utility class for streaming text responses.
 */
declare class StreamingTextResponse extends Response {
    constructor(res: ReadableStream, init?: ResponseInit);
}
/**
 * A utility function to stream a ReadableStream to a Node.js response-like object.
 */
declare function streamToResponse(res: ReadableStream, response: ServerResponse, init?: {
    headers?: Record<string, string>;
    status?: number;
}): void;

declare function HuggingFaceStream(res: AsyncGenerator<any>, callbacks?: AIStreamCallbacks): ReadableStream;

declare function CohereStream(res: AsyncGenerator<any>, callbacks?: AIStreamCallbacks): ReadableStream;

declare function AnthropicStream(res: Response, cb?: AIStreamCallbacks): ReadableStream;

declare function LangChainStream(callbacks?: AIStreamCallbacks): {
    stream: ReadableStream<Uint8Array>;
    handlers: {
        handleLLMNewToken: (token: string) => Promise<void>;
        handleChainEnd: () => Promise<void>;
        handleLLMError: (e: any) => Promise<void>;
    };
};

/**
 * Shared types between the API and UI packages.
 */
type Message = {
    id: string;
    createdAt?: Date;
    content: string;
    role: 'system' | 'user' | 'assistant';
};
type CreateMessage = {
    id?: string;
    createdAt?: Date;
    content: string;
    role: 'system' | 'user' | 'assistant';
};
type RequestOptions = {
    headers?: Record<string, string> | Headers;
    body?: object;
};
type UseChatOptions = {
    /**
     * The API endpoint that accepts a `{ messages: Message[] }` object and returns
     * a stream of tokens of the AI chat response. Defaults to `/api/chat`.
     */
    api?: string;
    /**
     * An unique identifier for the chat. If not provided, a random one will be
     * generated. When provided, the `useChat` hook with the same `id` will
     * have shared states across components.
     */
    id?: string;
    /**
     * Initial messages of the chat. Useful to load an existing chat history.
     */
    initialMessages?: Message[];
    /**
     * Initial input of the chat.
     */
    initialInput?: string;
    /**
     * Callback function to be called when the API response is received.
     */
    onResponse?: (response: Response) => void | Promise<void>;
    /**
     * Callback function to be called when the chat is finished streaming.
     */
    onFinish?: (message: Message) => void;
    /**
     * Callback function to be called when an error is encountered.
     */
    onError?: (error: Error) => void;
    /**
     * HTTP headers to be sent with the API request.
     */
    headers?: Record<string, string> | Headers;
    /**
     * Extra body object to be sent with the API request.
     * @example
     * Send a `sessionId` to the API along with the messages.
     * ```js
     * useChat({
     *   body: {
     *     sessionId: '123',
     *   }
     * })
     * ```
     */
    body?: object;
    /**
     * Whether to send extra message fields such as `message.id` and `message.createdAt` to the API.
     * Defaults to `false`. When set to `true`, the API endpoint might need to
     * handle the extra fields before forwarding the request to the AI service.
     */
    sendExtraMessageFields?: boolean;
};
type UseCompletionOptions = {
    /**
     * The API endpoint that accepts a `{ prompt: string }` object and returns
     * a stream of tokens of the AI completion response. Defaults to `/api/completion`.
     */
    api?: string;
    /**
     * An unique identifier for the chat. If not provided, a random one will be
     * generated. When provided, the `useChat` hook with the same `id` will
     * have shared states across components.
     */
    id?: string;
    /**
     * Initial prompt input of the completion.
     */
    initialInput?: string;
    /**
     * Initial completion result. Useful to load an existing history.
     */
    initialCompletion?: string;
    /**
     * Callback function to be called when the API response is received.
     */
    onResponse?: (response: Response) => void | Promise<void>;
    /**
     * Callback function to be called when the completion is finished streaming.
     */
    onFinish?: (prompt: string, completion: string) => void;
    /**
     * Callback function to be called when an error is encountered.
     */
    onError?: (error: Error) => void;
    /**
     * HTTP headers to be sent with the API request.
     */
    headers?: Record<string, string> | Headers;
    /**
     * Extra body object to be sent with the API request.
     * @example
     * Send a `sessionId` to the API along with the prompt.
     * ```js
     * useChat({
     *   body: {
     *     sessionId: '123',
     *   }
     * })
     * ```
     */
    body?: object;
};

export { AIStream, AIStreamCallbacks, AIStreamParser, AnthropicStream, CohereStream, CreateMessage, HuggingFaceStream, LangChainStream, Message, OpenAIStream, RequestOptions, StreamingTextResponse, UseChatOptions, UseCompletionOptions, createCallbacksTransformer, createEventStreamTransformer, streamToResponse, trimStartOfStreamHelper };
