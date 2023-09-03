import { markRaw } from 'vue';
import type { RouteLocation } from 'vue-router';

const S = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

interface PageOptions {
  route: RouteLocation;
}

type BeforePopHandler = () => boolean;

export interface Page extends PageOptions {
  onBeforePopHandlers: BeforePopHandler[];
  onBeforePop: (a: () => boolean) => void;
  equals: (a: Page) => boolean;
  uuid: string;
}

export function createPage(page: PageOptions): Page {
  const uuid = Array.from(Array(16))
    .map(() => S[Math.floor(Math.random() * S.length)])
    .join('');
  const onBeforePopHandlers = [];
  return {
    route: markRaw(page.route),

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
