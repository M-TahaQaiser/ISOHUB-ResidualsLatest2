import 'dotenv/config';
import fetch from 'cross-fetch';

// Ensure global fetch exists before any other imports
if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = fetch as any;
}

// Polyfill Web Crypto API `crypto.getRandomValues` for older Node versions
try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!globalThis.crypto) {
    // @ts-ignore
    const { webcrypto } = await import('crypto');
    // @ts-ignore
    globalThis.crypto = webcrypto;
  }
} catch (e) {
  // ignore if crypto not available
}

// Load the main server
import './index';
