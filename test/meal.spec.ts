import { it, describe, beforeAll, afterAll, beforeEach, expect } from 'vitest'
import { execSync } from 'node:child_process'
import { app } from '../src/app'
import request from 'supertest'

describe('Meal route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new meal', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@example.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'New meal',
        description: 'new meal description',
        date: 1704372956,
        isOnDiet: true,
      })
      .expect(201)
  })

  it('should be able to list all meals', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@example.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'New meal',
        description: 'new meal description',
        date: 1704372956,
        isOnDiet: true,
      })
      .expect(201)

    const meals = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(meals.body.meals).toEqual([
      expect.objectContaining({
        name: 'New meal',
        description: 'new meal description',
        date: 1704372956,
        is_on_diet: 1,
      }),
    ])
  })

  it('should be able to get a specific meal', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@example.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'New meal',
        description: 'new meal description',
        date: 1704372956,
        isOnDiet: true,
      })
      .expect(201)

    const meals = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    const mealId = meals.body.meals[0].id

    const meal = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    expect(meal.body.meal).toEqual(
      expect.objectContaining({
        name: 'New meal',
        description: 'new meal description',
        date: 1704372956,
        is_on_diet: 1,
      }),
    )
  })

  it('should be able to update a specific meal', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@example.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'New meal',
        description: 'new meal description',
        date: 1704372956,
        isOnDiet: true,
      })
      .expect(201)

    const meals = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    const mealId = meals.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'New meal 2',
        description: 'new meal 2 description',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(204)
  })

  it('should be able to delete a specific meal', async () => {
    const user = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@example.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .send({
        name: 'New meal',
        description: 'new meal description',
        date: 1704372956,
        isOnDiet: true,
      })
      .expect(201)

    const meals = await request(app.server)
      .get('/meals')
      .set('Cookie', user.get('Set-Cookie'))
      .expect(200)

    const mealId = meals.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', user.get('Set-Cookie'))
      .expect(204)
  })

  it('should be able to get metrics from a user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@gmail.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'meal 1',
        description: 'meal 1 description',
        isOnDiet: true,
        date: new Date('2021-01-01T08:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'meal 2 ',
        description: 'meal 2 description',
        isOnDiet: false,
        date: new Date('2021-01-01T12:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'meal 3',
        description: 'meal 3 description',
        isOnDiet: true,
        date: new Date('2021-01-01T15:00:00'),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'meal 4',
        description: 'meal 3 description',
        isOnDiet: true,
        date: new Date('2021-01-01T20:00:00'),
      })

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .send({
        name: 'meal 5',
        description: 'meal 5 description',
        isOnDiet: true,
        date: new Date('2021-01-02T08:00:00'),
      })

    const metricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', userResponse.get('Set-Cookie'))
      .expect(200)

    expect(metricsResponse.body).toEqual({
      totalMeals: 5,
      totalMealsOnDiet: 4,
      totalMealsOffDiet: 1,
      bestOnDietSequence: 3,
    })
  })
})
