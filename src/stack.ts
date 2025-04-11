import type { Router, RouteLocationRaw, RouteLocation } from 'vue-router';
import { inject, shallowReadonly, reactive } from 'vue';
import type { Reactive } from 'vue';
import { createPage } from './page';
import type { Page } from './page';

type ReadonlyStacks = Readonly<Reactive<Array<Page>>>

type NavigationGuardReturn = void | Error | boolean | RouteLocationRaw
type NavigationGuard = (
  to: RouteLocation,
  from: RouteLocation | undefined,
  next?: () => void
) => NavigationGuardReturn | Promise<NavigationGuardReturn>

export interface Stack {
  getStacks: () => ReadonlyStacks;
  push: (route: string | RouteLocationRaw) => void;
  stackPush: (route: string | RouteLocationRaw) => Promise<boolean>;
  pop: (allowRoot?: boolean) => void;
  remove: (page: Page) => void;
  replace: (route: string | RouteLocationRaw) => void;
  beforeEach: (guard: NavigationGuard) => void;
  router: Router;
}

export function useStack(): Stack {
  return inject('stacked-ui')!;
}

const globalBeforeEachGuards: NavigationGuard[] = [];

export function registerBeforeEachGuard(guard: NavigationGuard) {
  globalBeforeEachGuards.push(guard);
}

/*
 * Build fullPath from Pages.
 */
export const pagesToPaths = (pages: ReadonlyStacks): string[] => {
  return pages.map((page) => page.route.fullPath)
}
export const pagesToPath = (pages: ReadonlyStacks): string => pagesToPaths(pages).join('/')

export const removePrefix = <T>(xs: T[], ys: T[]): T[] => {
  if (xs.length === 0 || ys.length === 0) return xs
  if (xs[0] !== ys[0]) return xs
  return removePrefix(xs.slice(1), ys.slice(1))
}

/*
 * Split path-string with '//' and normalize '/' prefixed.
 */
export const splitPath = (path: string): string[] => {
  const paths = path.split(/\/\/(?=[^\/])/)
  return paths.map(x => x.startsWith('/') ? x : '/' + x)
};

const getCurrentRoute = (stack: Reactive<Array<Page>>): RouteLocation | undefined => {
  if (stack.length === 0) return undefined;
  return stack[stack.length - 1].route;
}

export function createStack(router: Router): Stack {
  const stack: Reactive<Array<Page>> = reactive([]);
  const beforeHooks: NavigationGuard[] = [];

  const getStacks = () => shallowReadonly(stack)
  
  
  /*
   * Resolve url with router, then returns Page, or undefined if not found.
   */
  const pathToPage = (loc: RouteLocationRaw): Page | undefined => {
    if (typeof loc === 'string' || loc instanceof String) {
      loc = ('/' + loc).replace(/^\/+/, '/');
    } else if (!('name' in loc)) {
      // if RouteLocationPathRaw, Avoid router uses root slug.
      const name = stack[stack.length - 1].route.name;
      // @ts-ignore
      loc.name = name;
    }
    const route = router.resolve(loc);
    if (route.matched.length == 0) return;
    if (route.meta?.stackable === false) return;
    if (!route.matched[0].components) return;
    return createPage({ route });
  };

  const runGuards = async (to: RouteLocation, from?: RouteLocation): Promise<boolean> => {
    const guards = beforeHooks.slice();
    for (const guard of guards) {
      const result = await Promise.resolve(guard(to, from));
      
      if (result === false) return false;
      
      if (typeof result === 'string' || (typeof result === 'object' && result !== null)) {
        const page = pathToPage(result);
        if (page) {
          stack.push(page);
          return false;
        }
      }
      
      if (result instanceof Error) {
        throw result;
      }
    }
    
    return true;
  };

  const stackPush = async (route: string | RouteLocationRaw) => {
    const page = pathToPage(route);
    if (page === undefined) throw new Error(`Can not resolve location ${route}`);
    
    const canProceed = await runGuards(page.route, getCurrentRoute(stack));
    if (!canProceed) return false;
    
    stack.push(page);
    return true;
  };

  const push = async (route: string | RouteLocationRaw) => {
    if (await stackPush(route)) {
      router.push(pagesToPaths(getStacks()).join('/'));
    }
  };

  const pop = (allowRoot: boolean = false) => {
    const page = stack[stack.length - 1];
    const res = page.onBeforePopHandlers.map((f) => f());
    if (res.every((x) => x === true) && (allowRoot || getStacks().length > 1)) {
      stack.pop();
      router.push(pagesToPaths(getStacks()).join('/'));
    }
  };

  const remove = (target: Page) => {
    const res = target.onBeforePopHandlers.map((f) => f());
    if (res.every((x) => x === true)) {
      const index = stack.findIndex((page) => page.equals(target));
      if (index !== -1)
        stack.splice(index, 1)
      router.push(pagesToPaths(getStacks()).join('/'));
    }
  };

  const replace = (route: string | RouteLocationRaw) => {
    const page = pathToPage(route);
    if (page === undefined) throw new Error('Can not resolve location');
    page.uuid = stack[stack.length - 1].uuid;
    stack[stack.length - 1] = page;
    router.push(pagesToPaths(getStacks()).join('/'));
  };

  const beforeEach = (guard: NavigationGuard) => {
    beforeHooks.push(guard);
  };

  globalBeforeEachGuards.forEach(guard => {
    beforeEach(guard);
  });
    
  const stackInstance = { 
    getStacks, 
    push, 
    pop, 
    remove, 
    replace, 
    beforeEach,
    stackPush,
    router,
  };
  
  return stackInstance;
}

export function makeHandler(stack: Stack) {
  const handleUrlChange = async (to: string, from: string) => {
    {
      // Same as known stack, nothing to do.
      const current = pagesToPaths(stack.getStacks())
      const isSameStack = to === current.join('/')
      if (isSameStack) return;
    }

    {
      // If only removed from tail. pop pages.
      const current = pagesToPaths(stack.getStacks())
      const popSuffix = removePrefix(current, splitPath(to));
      for (const p of popSuffix) {
        await stack.pop(true);
        // little wati for smooth sliding animation when "bulk pop".
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    {
      // If only added to tail. push pages.
      const current = pagesToPaths(stack.getStacks())
      const pushSuffix = removePrefix(splitPath(to), current);
      for (const p of pushSuffix) {
        // Using stack.stackPush instead of stack.push to avoid triggering stack.pop in the process
        await stack.stackPush(p);
      }
      // call router.push only once
      stack.router.push(pagesToPaths(stack.getStacks()).join('/'));
    }
  };
  
  return handleUrlChange;
}
