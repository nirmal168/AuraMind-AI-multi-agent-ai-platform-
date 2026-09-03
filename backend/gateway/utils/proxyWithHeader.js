import proxy from 'express-http-proxy'

export const proxyWithHeader = serviceUrl => {
  return proxy(serviceUrl, {
    timeout: 120000,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      const uid = srcReq.user?.userId || srcReq.user?._id || srcReq.user?.id
      if (uid) {
        proxyReqOpts.headers['x-user-id'] = String(uid)
      }
      return proxyReqOpts
    },
    proxyErrorHandler: (err, res, next) => {
      console.error(`Proxy Error to ${serviceUrl}:`, err?.message)
      res.status(502).json({ message: `Service connection error (${serviceUrl})` })
    }
  })
}
