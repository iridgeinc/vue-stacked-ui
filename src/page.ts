import { markRaw, defineAsyncComponent, type Component } from 'vue';
import type { RouteLocation } from 'vue-router';

const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const loadComponent = (route: RouteLocation): Component => {
  let component = route.matched[0].components!.default;
  if (typeof component == 'function') {
    // component may type () => import(...) when Vue load.
    // https://vuejs.org/guide/components/async.html#basic-usage
    // @ts-ignore
    component = defineAsyncComponent(component);
  }
  return component;
};

interface PageOptions {
  route: RouteLocation;
}

type BeforePopHandler = () => boolean;

export interface Page extends PageOptions {
  onBeforePopHandlers: BeforePopHandler[];
  onBeforePop: (a: () => boolean) => void;
  equals: (a: Page) => boolean;
  uuid: string;
  component: Component;
}

export function createPage(page: PageOptions): Page {
  const uuid = Array.from(Array(16))
    .map(() => S[Math.floor(Math.random() * S.length)])
    .join('');
  const onBeforePopHandlers = [];
  return {
    route: markRaw(page.route),
    component: markRaw(loadComponent(page.route)),

    uuid,

    onBeforePopHandlers,

    onBeforePop(f: BeforePopHandler): void {
      this.onBeforePopHandlers.push(f);
    },

    equals(other: Page): boolean {
      return uuid === other.uuid;
    },
  };
}
