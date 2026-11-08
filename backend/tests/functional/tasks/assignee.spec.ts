import Task from '#models/task'
import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito «Lo que cada tarea muestra de su responsable» de
 * `openspec/specs/tasks/spec.md`: el responsable se identifica por nombre e
 * iniciales, la tarea no filtra datos de su cuenta, y una cuenta sin nombre
 * sigue llegando con iniciales.
 *
 * El scenario de la fuga dice «cualquier tarea, suelta o dentro de la lista»,
 * así que se comprueba en cada respuesta que devuelve tareas: la lista, la
 * tarea suelta, la recién creada y la que acaba de cambiar de estado.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const HOY = '2026-11-08'

  async function tareaDe(fullName: string | null, email = 'ada@example.com') {
    const user = await User.create({ fullName, email, password: 'secreto123' })
    const task = await Task.create({
      title: 'Revisar el informe',
      status: 'pending',
      assigneeId: user.id,
    })

    return { user, task }
  }

  /**
   * El `data` sin el tipo del registro. Ese tipo se genera a partir de lo que
   * los transformers devuelven HOY, email incluido, así que tiparlo contra él
   * sería validar el test con el mismo comportamiento que quiere detectar.
   */
  function datos(response: { body(): unknown }): any {
    return (response.body() as { data: unknown }).data
  }

  function noFiltraLaCuenta(assert: any, assignee: Record<string, unknown>, email: string) {
    assert.notProperty(assignee, 'email')
    assert.notProperty(assignee, 'password')
    assert.notInclude(JSON.stringify(assignee), email)
  }

  test('en la lista, el responsable trae su nombre y sus iniciales', async ({ client, assert }) => {
    const { user, task } = await tareaDe('Ada Lovelace')

    const response = await client.get('/api/v1/tasks').loginAs(user)

    response.assertStatus(200)

    const fila = datos(response).find((t: any) => t.id === task.id)
    assert.equal(fila.assignee.fullName, 'Ada Lovelace')
    assert.equal(fila.assignee.initials, 'AL')
  })

  test('en la tarea suelta, el responsable trae su nombre y sus iniciales', async ({
    client,
    assert,
  }) => {
    const { user, task } = await tareaDe('Ada Lovelace')

    const response = await client.get(`/api/v1/tasks/${task.id}`).qs({ today: HOY }).loginAs(user)

    response.assertStatus(200)
    assert.equal(datos(response).assignee.fullName, 'Ada Lovelace')
    assert.equal(datos(response).assignee.initials, 'AL')
  })

  test('la tarea suelta no expone el email del responsable', async ({ client, assert }) => {
    const { user, task } = await tareaDe('Ada Lovelace')

    const response = await client.get(`/api/v1/tasks/${task.id}`).qs({ today: HOY }).loginAs(user)

    response.assertStatus(200)
    noFiltraLaCuenta(assert, datos(response).assignee, 'ada@example.com')
  })

  test('la lista no expone el email del responsable', async ({ client, assert }) => {
    const { user, task } = await tareaDe('Ada Lovelace')

    const response = await client.get('/api/v1/tasks').loginAs(user)

    response.assertStatus(200)

    const fila = datos(response).find((t: any) => t.id === task.id)
    noFiltraLaCuenta(assert, fila.assignee, 'ada@example.com')
  })

  test('la tarea recién creada no expone el email del responsable', async ({ client, assert }) => {
    const user = await User.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secreto123',
    })

    const response = await client
      .post('/api/v1/tasks')
      .json({ title: 'Revisar el informe' })
      .loginAs(user)

    response.assertStatus(201)
    noFiltraLaCuenta(assert, datos(response).assignee, 'ada@example.com')
  })

  test('la tarea que cambia de estado no expone el email del responsable', async ({
    client,
    assert,
  }) => {
    const { user, task } = await tareaDe('Ada Lovelace')

    const response = await client
      .patch(`/api/v1/tasks/${task.id}/status`)
      .json({ status: 'in_progress' })
      .loginAs(user)

    response.assertStatus(200)
    noFiltraLaCuenta(assert, datos(response).assignee, 'ada@example.com')
  })

  test('un responsable sin nombre llega con nombre nulo e iniciales', async ({
    client,
    assert,
  }) => {
    const { user, task } = await tareaDe(null, 'sin-nombre@example.com')

    const lista = await client.get('/api/v1/tasks').loginAs(user)
    const suelta = await client.get(`/api/v1/tasks/${task.id}`).qs({ today: HOY }).loginAs(user)

    lista.assertStatus(200)
    suelta.assertStatus(200)

    const fila = datos(lista).find((t: any) => t.id === task.id)

    for (const assignee of [fila.assignee, datos(suelta).assignee]) {
      assert.isNull(assignee.fullName)
      assert.equal(assignee.initials, 'SE')
      // Las iniciales salen del email, pero el email en sí no puede viajar con
      // ellas: es justo lo que el scenario quiere evitar.
      noFiltraLaCuenta(assert, assignee, 'sin-nombre@example.com')
    }
  })
})
