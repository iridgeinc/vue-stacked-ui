<script setup lang="ts">
import { computed } from 'vue';
import { useStack } from '../stack';

const stack = useStack();
const page = computed(() => (stack.getStacks().length > 0 ? stack.getStacks()[0] : null));
</script>

<template>
  <template v-if="page">
    <component :is="page.component" :current-stack="page" v-bind="page.route.params"> </component>
  </template>
</template>
