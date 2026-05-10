/**
 * Centralised response helpers.
 * Guarantee a consistent { success, ...data } shape across all controllers.
 */

/** 2xx success */
export const ok = (res, data = {}, status = 200) =>
  res.status(status).json({ success: true, ...data })

/** 4xx / 5xx error */
export const fail = (res, message, status = 400) =>
  res.status(status).json({ success: false, message })
