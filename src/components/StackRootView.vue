<script setup lang="ts">
import { ref, watch, isReactive, computed } from 'vue';
import { useStack } from '../stack';
import type { Page } from '../page';
import type { UnwrapNestedRefs, DeepReadonly, Ref, ComputedRef, Reactive } from 'vue';

const stack = useStack();
// const page = ref<DeepReadonly<Page> | undefined>(undefined);
//
// watch(stack.getStacks(), () => {
//   if (stack.getStacks().length > 0) page.value = stack.getStacks()[0];
// });
//
const page = computed(() => (stack.getStacks().length > 0 ? stack.getStacks()[0] : null));
//
</script>

<template>
  <template v-if="page">
    <component :is="page.component" :current-stack="page" v-bind="page.route.params"> </component>
  </template>
</template>
