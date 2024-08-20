import { expect, test, describe } from 'vitest'
import { defineComponent } from 'vue';
import {
  makeHandler,
  createStack,
  pagesToPaths,
  removePrefix,
  splitPath,
} from '../src/stack'
import { createPage } from '../src/page'
import { createRouter, createMemoryHistory, createWebHashHistory } from 'vue-router'


const init = () => {
  const history = createMemoryHistory('/')
  history.listen((...args: any[]) => console.log('History', args))
  const router = createRouter({
    history: history,
    routes: [
      {
        path: '/',
        name: 'home',
        component: async () => defineComponent({displayName: 'root'}),
        meta: { stackable: true }
      },
      {
        // path: '/sample/:v1?/:v2?/:v3?/\/:slug(.*)?',
        path: '/sample/:v1?/:v2?/:v3?',
        name: 'sample',
        component: async () => defineComponent({displayName: 'sample'}),
        props: true,
        meta: { stackable: true }
      },
      {
        path: '/sample2/',
        name: 'sample2',
        component: async () => defineComponent({displayName: 'sample2'}),
        props: true,
        meta: { stackable: true }
      }      
    ]
  })
  const stack = createStack(router)
  const handler = makeHandler(stack)
  router.beforeEach((to, from) => handler(to.fullPath, from.fullPath))
  return { history, router, stack, handler }
}

const expectSamePath = (a: string, b: string) => expect(splitPath(a)).toStrictEqual(splitPath(b))

describe('test splitPath', () => {
  const cases = [
    '/a/b//c',      // split in /a/b__c
    '//a/b//',      // split in __a/b//
    '///a/b///c/',  // split in /__a/b/__c/
    '///a/b///c//', // split in /__a/b/__c//
    '/',
    '',
  ]
  test(cases[0], () => {
    const ret = splitPath(cases[0])
    expect(ret.length).toBe(2)
    expect(ret[0]).toBe('/a/b')
    expect(ret[1]).toBe('/c')
  })
  test(cases[1], () => {
    const ret = splitPath(cases[1])
    console.log(ret)
    expect(ret.length).toBe(2)
    expect(ret[0]).toBe('/')
    expect(ret[1]).toBe('/a/b//')
  })
  test(cases[2], () => {
    const ret = splitPath(cases[2])
    expect(ret.length).toBe(3)
    expect(ret[0]).toBe('/')
    expect(ret[1]).toBe('/a/b/')
    expect(ret[2]).toBe('/c/')
  })
  test(cases[3], () => {
    const ret = splitPath(cases[3])
    expect(ret.length).toBe(3)
    expect(ret[0]).toBe('/')
    expect(ret[1]).toBe('/a/b/')
    expect(ret[2]).toBe('/c//')
  })
  test(cases[4], () => {
    const ret = splitPath(cases[4])
    expect(ret.length).toBe(1)
    expect(ret[0]).toBe('/')
  })
  test(cases[5], () => {
    const ret = splitPath(cases[5])
    expect(ret.length).toBe(1)
    expect(ret[0]).toBe('/')
  })
})


describe('pagesToPaths', () => {
  const { router } = init()
  const genPages = (...xs: string[]) => xs.map(x => createPage({route: router.resolve(x)}))
  test('', () => {
    const pages = genPages()
    expect(pagesToPaths(pages)).toStrictEqual([])
  })
  test('//sample', () => {
    const pages = genPages('/', '/sample')
    expect(pagesToPaths(pages)).toStrictEqual(['/', '/sample'])
  })  
})

describe('test removePrefix', () => {
  const cases = [
    [['/a', '/b'], []],
    [['/a', '/b'], ['/a']],
    [['/a', '/b'], ['/a', '/b']],
    [['/a', '/b'], ['/b']],
    [['/a', '/b'], ['/a', '/c']],
  ]
  test(JSON.stringify(cases[0]), () => {
    const [a, b] = cases[0]
    const ret = removePrefix(a, b)
    expect(ret).toStrictEqual(['/a', '/b'])
  })
  test(JSON.stringify(cases[1]), () => {
    const [a, b] = cases[1]
    const ret = removePrefix(a, b)
    expect(ret).toStrictEqual(['/b'])
  })
  test(JSON.stringify(cases[2]), () => {
    const [a, b] = cases[2]
    const ret = removePrefix(a, b)
    expect(ret).toStrictEqual([])
  })
  test(JSON.stringify(cases[3]), () => {
    const [a, b] = cases[3]
    const ret = removePrefix(a, b)
    expect(ret).toStrictEqual(['/a', '/b'])
  })
  test(JSON.stringify(cases[4]), () => {
    const [a, b] = cases[4]
    const ret = removePrefix(a, b)
    expect(ret).toStrictEqual(['/b'])
  })
})



describe('test stack initiate case', () => {
  test('/', async () => {
    const { stack, router, history } = init()
    await router.push('/')
    expect(stack.getStacks().length).toBe(1)
    expect(stack.getStacks()[0].route.fullPath).toBe('/')
  })

  test('/sample', async () => {
    const { stack, handler, router } = init()
    await router.push('/sample')
    expect(stack.getStacks().length).toBe(1)
    expect(stack.getStacks()[0].route.fullPath).toBe('/sample')
  })
  
  test('//sample/', async () => {
    const { stack, handler, router, history } = init()
    await router.push('//sample/')
    expect(stack.getStacks().length).toBe(2)
    expect(stack.getStacks()[0].route.fullPath).toBe('/')
    expect(stack.getStacks()[1].route.fullPath).toBe('/sample/')
  })
})
  
describe('test stack push case', () => {
  test('/ to //sample/', async () => {
    const { stack, handler, router } = init()
    await router.push('/')
    expect(stack.getStacks().length).toBe(1)
    await router.push('//sample/')
    expect(stack.getStacks().length).toBe(2)
    expect(stack.getStacks()[0].route.fullPath).toBe('/')
    expect(stack.getStacks()[1].route.fullPath).toBe('/sample/')
  })

  test('/sample/ to /sample//sample/sample//sample/', async () => {
    const { stack, handler, router, history } = init()
    await router.push('/sample/')
    expect(stack.getStacks().length).toBe(1)
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(history.location).toBe('/sample/')
    await router.push('/sample//sample/sample//sample/')
    expect(stack.getStacks().length).toBe(3)
    expect(stack.getStacks()[0].route.fullPath).toBe('/sample')
    expect(stack.getStacks()[1].route.fullPath).toBe('/sample/sample')
    expect(stack.getStacks()[2].route.fullPath).toBe('/sample/')
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(history.location).toBe('/sample//sample/sample//sample/')
  })  
})

describe('test stack pop case', () => {
  test('//sample/ to /', async () => {
    const { stack, handler, router, history } = init()
    await router.push('//sample/')
    expectSamePath(history.location, '//sample/')
    expect(stack.getStacks().length).toBe(2)
    await router.push('/')
    expect(stack.getStacks().length).toBe(1)
    expect(stack.getStacks()[0].route.fullPath).toBe('/')
  })

  test('//sample//sample/ to /', async () => {
    const { stack, handler, router, history } = init()
    await router.push('//sample//sample/')
    expect(stack.getStacks().length).toBe(3)
    await new Promise((resolve) => setTimeout(resolve, 100));
    expectSamePath(history.location, '//sample//sample/')
    await router.push('/')
    expect(stack.getStacks().length).toBe(1)
    expect(stack.getStacks()[0].route.fullPath).toBe('/')
    await new Promise((resolve) => setTimeout(resolve, 100));
    expectSamePath(history.location, '/')
  })  
})

describe('test stack pop+push case', () => {
  test('//sample/ to //sample2', async () => {
    const { stack, handler, router, history } = init()
    await router.push('//sample/')
    expectSamePath(history.location, '//sample/')
    expect(stack.getStacks().length).toBe(2)
    await router.push('//sample2')
    expect(stack.getStacks().length).toBe(2)
    expect(stack.getStacks()[0].route.fullPath).toBe('/')
    expect(stack.getStacks()[1].route.fullPath).toBe('/sample2')
    await new Promise((resolve) => setTimeout(resolve, 100));
    expectSamePath(history.location, '//sample2')
  })

  test('/sample2//sample/ to /sample/', async () => {
    const { stack, handler, router, history } = init()
    await router.push('/sample2//sample/')
    expect(stack.getStacks().length).toBe(2)
    await new Promise((resolve) => setTimeout(resolve, 100));
    expectSamePath(history.location, '/sample2//sample/')
    await router.push('/sample/')
    expect(stack.getStacks().length).toBe(1)
    expect(stack.getStacks()[0].route.fullPath).toBe('/sample/')
    await new Promise((resolve) => setTimeout(resolve, 100));
    expectSamePath(history.location, '/sample/')
  })  
})
