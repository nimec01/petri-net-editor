import type { PetriNetElementData, PetriNetState } from '~/types/petri-net';
import { deflateSync, inflateSync } from 'fflate';

function uint8ToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function base64urlToUint8(str: string): Uint8Array {
  let b64 = str.replaceAll('-', '+').replaceAll('_', '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeState(state: PetriNetState): string {
  const json = JSON.stringify(state);
  const encoder = new TextEncoder();
  const compressed = deflateSync(encoder.encode(json));
  return uint8ToBase64url(compressed);
}

export function decodeState(encoded: string): PetriNetState | null {
  try {
    const compressed = base64urlToUint8(encoded);
    const decompressed = inflateSync(compressed);
    const decoder = new TextDecoder();
    const json = decoder.decode(decompressed);
    const state = JSON.parse(json) as PetriNetState;
    if (!state.elements || !Array.isArray(state.elements)) {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export interface PostLoadBody {
  net?: PetriNetState;
  elements?: PetriNetElementData[];
  formatVersion?: number;
}

export function parseNetState(body: unknown): PetriNetState | null {
  let candidate = body;
  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return null;
    }
  }
  if (typeof candidate !== 'object' || candidate === null) {
    return null;
  }

  const parsed = candidate as PostLoadBody;
  const state = (Array.isArray(parsed.elements) ? parsed : parsed.net) as PetriNetState | undefined;
  if (!state || !Array.isArray(state.elements)) {
    return null;
  }
  return state;
}
