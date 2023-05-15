<script setup lang="ts">
 import { reactive, ref, watch, markRaw, nextTick, defineAsyncComponent } from 'vue';
 import type { Page } from '../page';
 import { useStack } from '../stack';

 const stack = useStack()
 
 const zip = (a: any, b: any) => Array.from(Array(Math.max(b.length, a.length)), (_, i) => [a[i], b[i]]);

 const currentStack: (Page | undefined)[] = reactive([]);
 const drawerOpened: boolean[] = reactive([]);
 const drawerWidth: number[] = reactive([]);
 const baseWidth = 95;

 watch(stack.stack, async (newStack) => {
   const count = newStack.filter((x) => x !== undefined).length;
   
   // hide scroll bar on "body" element.
   if (count == 0) {
     document.body.style.overflow = "auto"
   } else {
     document.body.style.overflow = "hidden"
   }
   
   for (let i = 0; i < Math.max(newStack.length, currentStack.length); i++) {
     
   }
   
   // FIXME: zip not needed
   zip(newStack, currentStack).forEach(async ([newPage, fromPage], i) => {
     if (typeof newPage?.component == 'function') {
       // toPage.component may type () => import(...) when Vue load.
       // https://vuejs.org/guide/components/async.html#basic-usage
       newPage.component = markRaw(defineAsyncComponent(newPage.component));
     }
     currentStack[i] = newPage;
     nextTick(() => {
       if (currentStack[i] !== undefined) {
         drawerWidth[i] = 100 - ((100 - baseWidth) / count) * (i + 1);
         setTimeout(() => {
           drawerOpened[i] = true;
         }, 0);
       } else {
         drawerWidth[i] = 0;
         setTimeout(() => {
           drawerOpened[i] = false;
         }, 0);
       }
     });
   });
 });
 
 function close() {
   stack.pop();
 }
</script>

<template>
  <template v-for="(page, i) in currentStack" :key="i">
    <div class="background" :class="{ backgroundOpened: drawerOpened[i] }" @:click="close" ><div></div></div>
    <div class="drawer" :class="{ drawerOpened: drawerOpened[i] }" :style="{ width: drawerWidth[i] + '%' }">
      <Suspense>
        <component
          v-if="page != undefined"
          :is="page.component"
          :current-stack="page"
          v-bind="page.params">
        </component>
        <template #fallback>
          <div>Loading...</div>
        </template>
      </Suspense>
      <button type="button" class="btn-close" @:click="close">
        <span class="icon-cross"></span>
        <span class="visually-hidden">Close</span>
      </button>
    </div>
  </template>
</template>

<style scoped lang="sass">
 .drawer {
   position: absolute;
   right: 0;
   z-index: 10;
   width: 95%;
   height: 100%;
   overflow-y: scroll;
   pointer-events: auto;
   background-color: #fff;
   transition: all 0.5s ease 0s;
   transform: translateX(100%);
 }

 .drawerOpened {
   transform: translateX(0);
 }

 .background {
   position: absolute;
   z-index: 10;
   width: 100%;
   height: 100%;
   overflow-y: scroll;
   pointer-events: none;
   background: #000;
   opacity: 0;
   transition: all 1s ease-in-out 0s;
 }

 .background div {
   height: 101%; /* Block body element scroll. */
 }

 .backgroundOpened {
   pointer-events: auto;
   opacity: 0.3;
 }

 @mixin cross($size: 20px, $color: currentColor, $thickness: 1px) {
   margin: 0;
   padding: 0;
   border: 0;
   background: none;
   position: relative;
   width: $size;
   height: $size;

 &:before,
 &:after {
   content: '';
   position: absolute;
   top: calc(($size - $thickness) / 2);
   left: 0;
   right: 0;
   height: $thickness;
   background: $color;
   border-radius: $thickness;
 }

 &:before {
   transform: rotate(45deg);
 }

 &:after {
   transform: rotate(-45deg);
 }

 span {
   display: block;
 }

 }

 .btn-close {
   position: absolute;
   right:20px;
   top:20px;
   margin: 0;
   border: 0;
   padding: 0;
   background: #555;
   opacity:0.5;
   border-radius: 50%;
   width: 40px;
   height: 40px;
   display: flex;
   flex-flow: column nowrap;
   justify-content: center;
   align-items: center;
   cursor: pointer;
   transition: all 150ms;
 
 .icon-cross {
 @include cross(30px, #fff, 3px);   
 }
 
 &:hover,
 &:focus {
 //transform: rotateZ(90deg);
   background: #888;
 }
 }

 .visually-hidden {
   display: none;
 }

</style>
