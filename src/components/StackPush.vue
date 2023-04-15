<script setup lang="ts">
 import type { RouteLocationRaw } from 'vue-router'
 import { useStack } from '../stack'

 const stack = useStack()
 const props = defineProps<{
   to: RouteLocationRaw
 }>();

 function push() {
   stack.push(props.to)
 }
</script>
<template>
  <a href="javascript:void(0)" @click="push"><slot></slot></a>
</template>
