import type { App, InjectionKey, Plugin } from 'vue';
import type { Router } from 'vue-router';
import { createStack } from './stack';
import StackView from './components/StackView.vue';
import StackPush from './components/StackPush.vue';
import StackPop from './components/StackPop.vue';

export type { Stack } from './stack';
export type { Page } from './page';
export { useStack } from './stack';

export const stackedUI: Plugin = {
  install: (app: App, options: { router: Router }) => {
    app.component('StackView', StackView);
    app.component('StackPush', StackPush);
    app.component('StackPop', StackPop);

    const stack = createStack(options.router);
    app.provide("stacked-ui", stack);

    // Handle URL change, for push/pop "stacked" page.
    options.router.beforeEach((to, from) => stack.handle(to, from));
  },
};
