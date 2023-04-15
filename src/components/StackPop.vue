<script setup lang="ts">
 import { useStack } from '../stack'

 const stack = useStack()

 function pop() {
   stack.pop()
 }
</script>
<template>
  <a href="javascript:void(0)" @click="pop"><slot></slot></a>
</template>
