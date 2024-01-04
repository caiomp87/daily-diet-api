import { fastify } from 'fastify'
import cookie from '@fastify/cookie'
import { userRoutes } from './routes/users'

const app = fastify()

app.register(cookie)

app.register(userRoutes, {
  prefix: 'users',
})

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('server is running')
  })
