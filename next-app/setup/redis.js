const { Redis } = require('ioredis')
const { redisConfig, firstUser, firstPartners } = require('../configuration')

/**
 * Object to control the config
 * Allows for change later in the code
 */
const config = {
  /**
   * Force the admin user to be created.
   * Automatically uses data from firstUser in the configuration file
   */
  FORCE_USER: false,
  /**
   * Force the admin user to be created.
   * Automatically uses data from firstPartners in the configuration file
   */

  FORCE_PARTNERS: false,
  /**
   * Resets all of the data
   * users all gets deleted
   * partners all get deleted
   */
  RESET_ALL: false
}

// Args but without the -
// Ex. "-a": "a": "-Apples": "apples"
const args = process.argv
  .map(x => x.toLowerCase())
  .filter(x => x.startsWith('-'))
  .map(x => x.split('').filter(y => y !== '-').join(''))
if (args.includes('reset') || args.includes('r')) config.RESET_ALL = true
if (args.includes('admin') || args.includes('a')) config.FORCE_USER = true
if (args.includes('partners') || args.includes('p')) config.FORCE_PARTNERS = true

async function setup () {
  const redis = new Redis(redisConfig)

  if (config.RESET_ALL) {
    const keys = []
    // Pushes all keys by destructuring arrays
    keys.push(
      ...await redis.keys('users.*'),
      ...await redis.keys('partners.*')
    )

    for (const key in keys)
      await redis.hdel(key, ['*'])

    return
  }

  if (config.FORCE_PARTNERS == true) {
    const keys = []

    keys.push(
      ...await redis.keys('partners.*')
    )

    for (const key in keys)
      await redis.hdel(key, ['*'])

    for (const p of firstPartners) {
      p.id = Math.max(...(await redis.keys('partners.*')).map(x => parseInt(x.split('.')[1])), 0) + 1
      await redis.hset(`partners.${p.id}`, p)
    }
    console.log('Partners reset')
  } else console.log('Partners not set')

  if (
    (await redis.keys('users.*')).length == 0 ||
    config.FORCE_USER == true
  ) {
    await redis.hset('users.0', firstUser)
    console.log(`Setup admin user. Username: ${firstUser.email} Password: ${firstUser.password}`)
  } else console.log('Admin user not set.')
}

// Exit when done
setup().then(() => { process.exit(1) })
