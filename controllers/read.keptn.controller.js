const express = require('express')
const router = express.Router()
const { logger } = require('../helpers/logger.helpers')
const uriHelpers = require('../helpers/uri.helpers')
const stringHelpers = require('../helpers/string.helpers')
const axios = require('axios')

router.get('/project/:endpoint/:name', async (req, res, next) => {
  try {
    const endpoint = JSON.parse(stringHelpers.b64toAscii(req.params.endpoint))
    const name = stringHelpers.b64toAscii(req.params.name)

    logger.debug(endpoint)

    const token = endpoint.secret.find((x) => x.key === 'token')

    const regex = /(?<=\[)[^\]\[]*(?=])/gm
    const projectName = name.match(regex)[0]

    const prj = await axios.get(
      uriHelpers.concatUrl([
        endpoint.target,
        'api/controlPlane/v1/project',
        projectName
      ]),
      {
        headers: {
          'x-token': token.val
        }
      }
    )

    const serviceName = name.replace(`[${projectName}]`, '')

    res.status(200).json({
      ...prj.data,
      stages: prj.data.stages.map((x) => {
        return {
          ...x,
          services: x.services.filter((x) => x.serviceName === serviceName)
        }
      })
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
