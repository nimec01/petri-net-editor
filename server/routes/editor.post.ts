import type { H3Event } from 'h3';
import type { PetriNetState } from '~/types/petri-net';
import { encodeState, parseNetState } from '~/utils/share';

async function readNetState(event: H3Event): Promise<PetriNetState | null> {
  const contentType = getRequestHeader(event, 'content-type') ?? '';

  if (contentType.startsWith('multipart/form-data')) {
    const parts = await readMultipartFormData(event);
    const net = parts?.find(part => part.name === 'net');
    return parseNetState(net?.data.toString('utf8'));
  }

  const body = await readBody(event) as Record<string, unknown> | undefined;
  const net = body?.net;
  return typeof net === 'string' ? parseNetState(net) : parseNetState(body);
}

export default defineEventHandler(async (event) => {
  const state = await readNetState(event);
  if (!state) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Petri net definition: the request body must be JSON with an "elements" array, or FormData with a "net" field containing that JSON.',
    });
  }

  const baseURL = (useRuntimeConfig().app.baseURL || '').replace(/\/$/, '');
  const encoded = encodeState(state);
  return sendRedirect(event, `${baseURL}/editor#${encoded}`, 303);
});
