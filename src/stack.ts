import type { Router, RouteLocationRaw, RouteLocationNamedRaw, RouteLocation } from 'vue-router';
import { inject, computed, ref, type Ref, type ComputedRef } from 'vue';
import { createPage } from './page';
import type { Page } from './page';

export interface Stack {
  stack: Ref<Page[]>;
  push: (route: RouteLocationRaw) => void;
  pop: () => void;
  remove: (page: Page) => void;
  replace: (route: RouteLocationRaw) => void;
  hasStack: ComputedRef<boolean>;
}

export function useStack(): Stack {
  return inject('stacked-ui')!;
}

/*
 * Build fullPath from Pages.
 */
const pagesToPath = (pages: Page[]): string => {
  const root = location.pathname.split('//')[0];
  return root + '/' + pages.map((page) => page.route.fullPath).join('/');
};

export function createStack(router: Router): Stack {
  const stack: Ref<Array<Page>> = ref([]);

  /*
   * Resolve url with router, then returns Page, or undefined if not found.
   */
  const pathToPage = (loc: RouteLocationRaw): Page | undefined => {
    if (typeof loc === 'string' || loc instanceof String) {
      loc = ('/' + loc).replace(/^\/+/, '/');
    } else if (!('name' in loc)) {
      // if RouteLocationPathRaw, Avoid router uses root slug.
      const name = stack.value[stack.value.length - 1].route.name;
      // @ts-ignore
      loc.name = name;
    }
    const route = router.resolve(loc);
    if (route.meta.stackable !== true || route.matched.length == 0) return;
    if (!route.matched[0].components) return;
    return createPage({ route });
  };

  const push = (route: string | RouteLocationNamedRaw) => {
    const page = pathToPage(route);
    if (page === undefined) throw new Error('Can not resolve location');
    stack.value.push(page);
    router.replace(pagesToPath(stack.value));
  };

  const pop = () => {
    const page = stack.value[stack.value.length - 1];
    const res = page.onBeforePopHandlers.map((f) => f());
    if (res.every((x) => x === true)) {
      stack.value.pop();
      router.replace(pagesToPath(stack.value));
    }
  };

  const remove = (target: Page) => {
    const res = target.onBeforePopHandlers.map((f) => f());
    if (res.every((x) => x === true)) {
      stack.value = stack.value.filter((page) => !page.equals(target));
      router.replace(pagesToPath(stack.value));
    }
  };

  const replace = (route: RouteLocationRaw) => {
    const page = pathToPage(route);
    if (page === undefined) throw new Error('Can not resolve location');
    page.uuid = stack.value[stack.value.length - 1].uuid;
    stack.value[stack.value.length - 1] = page;
    router.replace(pagesToPath(stack.value));
  };

  const hasStack = computed(() => stack.value.length > 0);

  return { stack, push, pop, remove, replace, hasStack };
}

export function makeHandler(stack: Stack) {
  // for visual effect, Drawer closes fluently.
  const waitSlide = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  /*
   * Remove all stacks then build from path.
   */
  const initStacks = async (path: string): Promise<void> => {
    for (;;) {
      if (stack.stack.value.length === 0) break;
      stack.pop();
    }

    for (const url of path.split('//').slice(1)) {
      stack.push(url);
      await waitSlide();
    }
  };

  const removePrefix = (s: string, prefix: string): string | undefined => {
    if (!s.startsWith(prefix)) return;
    if (s === prefix) return;
    return s.replace(prefix, '');
  };

  /*
   * Split path-string with '//' and normalize '/' prefixed.
   */
  const splitPath = (path: string): string[] => {
    const paths = path.split('//').slice(1);
    return paths.map((x) => '/' + x);
  };

  const handleUrlChange = async (to: RouteLocation, from: RouteLocation) => {
    const [toPath, fromPath] = [to.fullPath, from.fullPath];

    // Same as known stack, nothing to do.
    const isSameStack = toPath === pagesToPath(stack.stack.value);
    if (isSameStack) return;

    // If only removed from tail. pop pages.
    const popSuffix = removePrefix(fromPath, toPath);
    if (popSuffix !== undefined) {
      for (const _path of splitPath(popSuffix)) {
        stack.pop();
        await waitSlide();
      }
      return;
    }

    // If only added to tail. push pages.
    const pushSuffix = removePrefix(toPath, fromPath);
    if (pushSuffix !== undefined) {
      for (const path of splitPath(pushSuffix)) {
        stack.push(path);
        await waitSlide();
      }
      return;
    }

    // Otherwith rebuild all
    initStacks(toPath);
  };

  return handleUrlChange;
}
