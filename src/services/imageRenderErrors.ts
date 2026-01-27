export type ImageRenderErrorCode =
    | 'IMAGE_RENDER_FAILED'
    | 'IMAGE_LOAD_FAILED'
    | 'IMAGE_ENCODE_FAILED'
    | 'IMAGE_WRITE_FAILED';

export type ImageRenderErrorContext = {
    // Short stable identifier for where/why this render happened (e.g. "tdoll2", "servers:map", "charts:7d").
    scene: string;
    fileName?: string;
    inputSummary?: string;
};

export class ImageRenderError extends Error {
    readonly code: ImageRenderErrorCode;
    readonly context: ImageRenderErrorContext;

    constructor(
        code: ImageRenderErrorCode,
        message: string,
        context: ImageRenderErrorContext,
        cause?: unknown,
    ) {
        super(message);
        this.name = 'ImageRenderError';
        this.code = code;
        this.context = context;

        // TS lib in this repo doesn't type ErrorOptions yet; attach best-effort.
        if (cause !== undefined) {
            (this as any).cause = cause;
        }
    }
}

export function asImageRenderError(
    err: unknown,
    fallback: {
        code: ImageRenderErrorCode;
        message: string;
        context: ImageRenderErrorContext;
    },
): ImageRenderError {
    if (err instanceof ImageRenderError) {
        return err;
    }
    if (err instanceof Error) {
        return new ImageRenderError(
            fallback.code,
            fallback.message,
            fallback.context,
            err,
        );
    }
    return new ImageRenderError(
        fallback.code,
        fallback.message,
        fallback.context,
        err,
    );
}
