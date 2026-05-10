import { fail } from '../utils/respond.js'

/**
 * Validate request section (`body`, `query`, `params`) with a Zod schema.
 * On success, stores parsed payload in `req.validated[section]`.
 */
export const validate = (schema, section = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[section])

  if (!result.success) {
    const message = result.error.issues.map(issue => issue.message).join('; ')
    return fail(res, message || `Invalid ${section}`)
  }

  req.validated ??= {}
  req.validated[section] = result.data
  return next()
}
