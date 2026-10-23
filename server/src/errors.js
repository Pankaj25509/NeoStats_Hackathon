function fail(res, status, error, details) {
  const body = { error };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}
module.exports = { fail };
