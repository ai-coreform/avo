// compression-polyfill.ts
/**
 * This is a polyfill for the CompressionStream and DecompressionStream.
 * This solves the issue where Drizzle Studio Can't find variable: CompressionStream
 *
 * ![BUG]: ReferenceError: Can't find variable: CompressionStream
 * @see https://github.com/drizzle-team/drizzle-orm/issues/3880
 *
 * Bun doesn't have CompressionStream and DecompressionStream yet
 * @see https://github.com/oven-sh/bun/issues/1723
 */

import zlib from "node:zlib";

type CompressionStreamFormat = "brotli" | "deflate" | "deflate-raw" | "gzip";

type CompressionTransform =
  | zlib.BrotliCompress
  | zlib.Deflate
  | zlib.DeflateRaw
  | zlib.Gzip;

type DecompressionTransform =
  | zlib.BrotliDecompress
  | zlib.Gunzip
  | zlib.Inflate
  | zlib.InflateRaw;

function unreachable(format: never): never {
  throw new Error(`Unsupported compression format: ${format}`);
}

function toBuffer(chunk: unknown) {
  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }
  if (chunk instanceof ArrayBuffer) {
    return Buffer.from(chunk);
  }
  if (ArrayBuffer.isView(chunk)) {
    return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  }
  if (typeof chunk === "string") {
    return Buffer.from(chunk);
  }
  throw new TypeError("Unsupported chunk type for compression stream polyfill");
}

function createCompressionHandle(
  format: CompressionStreamFormat
): CompressionTransform {
  switch (format) {
    case "brotli":
      return zlib.createBrotliCompress();
    case "deflate":
      return zlib.createDeflate();
    case "deflate-raw":
      return zlib.createDeflateRaw();
    case "gzip":
      return zlib.createGzip();
    default:
      return unreachable(format);
  }
}

function createDecompressionHandle(
  format: CompressionStreamFormat
): DecompressionTransform {
  switch (format) {
    case "brotli":
      return zlib.createBrotliDecompress();
    case "deflate":
      return zlib.createInflate();
    case "deflate-raw":
      return zlib.createInflateRaw();
    case "gzip":
      return zlib.createGunzip();
    default:
      return unreachable(format);
  }
}

class CompressionStreamPolyfill {
  readonly readable;
  readonly writable;

  constructor(format: CompressionStreamFormat) {
    const handle = createCompressionHandle(format);
    this.readable = new ReadableStream({
      start(controller) {
        handle.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        handle.once("end", () => controller.close());
        handle.once("error", (error) => controller.error(error));
      },
    });
    this.writable = new WritableStream({
      write(chunk) {
        handle.write(toBuffer(chunk));
      },
      close() {
        handle.end();
      },
      abort() {
        handle.destroy();
      },
    });
  }
}

class DecompressionStreamPolyfill {
  readonly readable;
  readonly writable;

  constructor(format: CompressionStreamFormat) {
    const handle = createDecompressionHandle(format);
    this.readable = new ReadableStream({
      start(controller) {
        handle.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        handle.once("end", () => controller.close());
        handle.once("error", (error) => controller.error(error));
      },
    });
    this.writable = new WritableStream({
      write(chunk) {
        handle.write(toBuffer(chunk));
      },
      close() {
        handle.end();
      },
      abort() {
        handle.destroy();
      },
    });
  }
}

globalThis.CompressionStream ??=
  CompressionStreamPolyfill as unknown as NonNullable<
    typeof globalThis.CompressionStream
  >;
globalThis.DecompressionStream ??=
  DecompressionStreamPolyfill as unknown as NonNullable<
    typeof globalThis.DecompressionStream
  >;
