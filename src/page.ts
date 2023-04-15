import type { Component } from 'vue';
import type { RouteParams } from 'vue-router';

interface PageOptions {
  url: string;
  component: Component | (() => Component);
  params: RouteParams;
  depth: number;
}

export interface Page extends PageOptions {
  onBeforePopHandler: () => boolean;
  onBeforePop: (a: () => boolean) => void;
  equals: (a: Page) => boolean;
}

export function createPage(page: PageOptions): Page {
  return {
    ...page,
    onBeforePopHandler(): boolean {
      return true;
    },

    onBeforePop(f: Page['onBeforePopHandler']): void {
      this.onBeforePopHandler = f;
    },

    equals(other: Page): boolean {
      return this.url === other.url && JSON.stringify(this.params) === JSON.stringify(other.params);
    },
  };
}
