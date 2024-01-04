import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { checkSessionIdExists } from '../middlewares/session-id'

export async function mealsRoute(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const meals = await knex('meals')
        .where({
          user_id: request.user?.id,
        })
        .orderBy('date', 'asc')

      return reply.status(200).send({ meals })
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealsParamSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getMealsParamSchema.parse(request.params)

      const meal = await knex('meals')
        .where({
          user_id: request.user?.id,
          id,
        })
        .first()

      return reply.status(200).send({ meal })
    },
  )

  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
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
        user_id: request.user?.id,
        name,
        description,
        date: date.getTime(),
        is_on_diet: isOnDiet,
      })

      return reply.status(201).send()
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const updateMealParamSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = updateMealParamSchema.parse(request.params)

      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
        date: z.coerce.date(),
      })

      const { name, description, isOnDiet, date } = updateMealBodySchema.parse(
        request.body,
      )

      const filter = {
        user_id: request.user?.id,
        id,
      }

      const meal = await knex('meals').where(filter).first()

      if (!meal) {
        return reply.status(404).send({ error: 'meal not found' })
      }

      await knex('meals').where(filter).update({
        name,
        description,
        is_on_diet: isOnDiet,
        date: date.getTime(),
      })

      return reply.status(204).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const deleteMealParamSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = deleteMealParamSchema.parse(request.params)

      const filter = {
        user_id: request.user?.id,
        id,
      }

      const meal = await knex('meals').where(filter).first()

      if (!meal) {
        return reply.status(404).send({ error: 'meal not found' })
      }

      await knex('meals').where(filter).delete()

      return reply.status(204).send()
    },
  )

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const totalMeals = await knex('meals')
        .where({
          user_id: request.user?.id,
        })
        .orderBy('date', 'desc')

      const totalMealsOnDiet = await knex('meals')
        .where({
          user_id: request.user?.id,
          is_on_diet: true,
        })
        .count('id', { as: 'total' })
        .first()

      const totalMealsOffDiet = await knex('meals')
        .where({
          user_id: request.user?.id,
          is_on_diet: false,
        })
        .count('id', { as: 'total' })
        .first()

      const { bestOnDietSequence } = totalMeals.reduce(
        (acc, meal) => {
          if (meal.is_on_diet) {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestOnDietSequence) {
            acc.bestOnDietSequence = acc.currentSequence
          }

          return acc
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      return reply.status(200).send({
        totalMeals: totalMeals.length,
        totalMealsOnDiet: totalMealsOnDiet?.total,
        totalMealsOffDiet: totalMealsOffDiet?.total,
        bestOnDietSequence,
      })
    },
  )
}
