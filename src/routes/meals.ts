import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

export async function mealsRoute(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const { sessionId } = request.cookies

    if (!sessionId) {
      return reply.status(401).send({ error: 'unauthorized' })
    }

    const user = await knex('users')
      .where({
        session_id: sessionId,
      })
      .first()

    if (!user) {
      return reply.status(401).send({ error: 'unauthorized' })
    }

    const meals = await knex('meals')
      .where({
        user_id: user?.id,
      })
      .orderBy('date', 'asc')

    return reply.status(200).send({ meals })
  })

  app.get('/:id', async (request, reply) => {
    const { sessionId } = request.cookies

    if (!sessionId) {
      return reply.status(401).send({ error: 'unauthorized' })
    }

    const user = await knex('users')
      .where({
        session_id: sessionId,
      })
      .first()

    if (!user) {
      return reply.status(401).send({ error: 'unauthorized' })
    }

    const getMealsParamSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealsParamSchema.parse(request.params)

    const meal = await knex('meals')
      .where({
        user_id: user.id,
        id,
      })
      .first()

    return reply.status(200).send({ meal })
  })

  app.get('/metrics', async (request, reply) => {
    return reply.status(200).send()
  })

  app.post('/', async (request, reply) => {
    const { sessionId } = request.cookies

    if (!sessionId) {
      return reply.status(401).send({ error: 'unauthorized' })
    }

    const user = await knex('users')
      .where({
        session_id: sessionId,
      })
      .first()

    if (!user) {
      return reply.status(401).send({ error: 'unauthorized' })
    }

    const createMealsBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      isOnDiet: z.boolean(),
    })

    const { name, description, date, isOnDiet } = createMealsBodySchema.parse(
      request.body,
    )

    await knex('meals').insert({
      id: randomUUID(),
      user_id: user?.id,
      name,
      description,
      date: date.getTime(),
      is_on_diet: isOnDiet,
    })

    return reply.status(201).send()
  })

  app.put('/:id', async (request, reply) => {
    return reply.status(204).send()
  })

  app.delete('/:id', async (request, reply) => {
    return reply.status(204).send()
  })
}
