import type { Router, RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import { inject, markRaw, reactive } from 'vue';
import { createPage } from './page';
import type { Page } from './page';

export interface Stack {
  stack: (Page | undefined)[];
  router: Router;
  pathToPage: (path: string) => Page[];
  handle: (to: RouteLocationNormalized, from: RouteLocationNormalized) => Promise<boolean>;
  push: (loc: RouteLocationRaw) => void;
  pop: () => void;
}

export function useStack(): Stack {
  return inject("stacked-ui")!
}

export function createStack(router: Router): Stack {
  return {
    stack: reactive([]),
    router: router,

    pathToPage(path: string): Page[] {
      const r: Page[] = [];
      for (let url of path.split('//').slice(1)) {
        if (!url.startsWith('/')) {
          url = '/' + url;
        }
        const routed = this.router.resolve(url);

        // Stop stacking if met non stackable route.
        if (routed.meta.stackable !== true || routed.matched.length == 0) break;
        if (!routed.matched[0].components) break;

        const component = routed.matched[0].components.default;

        r.push(
          createPage({
            url: url,
            component: markRaw(component),
            params: routed.params,
            depth: r.length,
          }),
        );
      }
      return r;
    },

    async handle(to: RouteLocationNormalized, _from: RouteLocationNormalized): Promise<boolean> {
      const toPages = this.pathToPage(to.fullPath);
      const fromPages = this.stack.filter((page): page is Page => page != undefined);

      // push newly found pages to stack
      for (let i = fromPages.length; i < toPages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        this.stack[i] = markRaw(toPages[i]);
      }

      // pop newly removed pages from stack
      for (let i = fromPages.length - 1; i >= toPages.length; i--) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        if (!fromPages[i].onBeforePopHandler?.()) {
          return false;
        }
        // remove page from URL and Stack object.
        history.replaceState(history.state, '', location.href.split('//').slice(0, -1).join('//'));
        this.stack[i] = undefined;
      }
      return true;
    },

    push(loc: RouteLocationRaw) {
      const targetLocation = this.router.resolve(loc);
      return this.router.push(location.pathname + '/' + targetLocation.fullPath);
    },

    pop() {
      this.router.push(location.pathname.split('//').slice(0, -1).join('//'));
    },
  };
}
