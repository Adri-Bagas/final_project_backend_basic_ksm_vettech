/**
 * Standard response envelopes.
 *
 * Success: { success: true,  message, data, meta? }
 * Failure: { success: false, message }
 *
 * `data` is always present (null when there is nothing to return).
 * `meta` is only present for paginated lists.
 */
export const sendSuccess = (res, { status = 200, message = "Success", data = null, meta } = {}) => {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
};

export const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });
