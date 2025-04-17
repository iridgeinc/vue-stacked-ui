import type { App, Plugin } from 'vue';
import type { Router } from 'vue-router';
import { makeHandler, Stack as StackType } from './stack';
import StackView from './components/StackView.vue';
import StackRootView from './components/StackRootView.vue';
import StackPush from './components/StackPush.vue';
import StackPop from './components/StackPop.vue';
import StackReplace from './components/StackReplace.vue';

export type { Stack } from './stack';
export type { Page } from './page';
export { useStack } from './stack';
export { createStack } from './stack';

export const stackedUI: Plugin = {
  install: (app: App, options: { stack: StackType, router: Router }) => {
    app.component('StackView', StackView);
    app.component('StackRootView', StackRootView);
    app.component('StackPush', StackPush);
    app.component('StackPop', StackPop);
    app.component('StackReplace', StackReplace);

    app.provide('stacked-ui', options.stack);

    // Handle URL change, for push/pop "stacked" page.
    const handler = makeHandler(options.stack);
    options.router.beforeEach((to, from) => handler(to.fullPath, from.fullPath))
  },
};
