<script setup lang="ts">
import { watchEffect } from 'vue';
import { useStack } from '../stack';

const stack = useStack();

const baseWidth = 95;

let cancel: number | undefined = undefined;
watchEffect(() => {
  if (stack.getStacks().length > 1) {
    clearTimeout(cancel);
    cancel = undefined;
    document.body.style.overflow = 'hidden';
  } else {
    if (cancel === undefined) {
      cancel = window.setTimeout(() => {
        document.body.style.overflow = 'auto';
      }, 150);
    }
  }
});

const drawerOffset = (index: number) => {
  const count = stack.getStacks().length - 1;
  return 100 - ((100 - baseWidth) / count) * (index + 1) - baseWidth;
};

function close() {
  stack.pop();
}
</script>

<template>
  <TransitionGroup>
    <template v-for="(page, i) in stack.getStacks().slice(1)" :key="page.uuid">
      <div class="background" @:click="close">
        <div></div>
      </div>
      <div class="drawer" :style="{ right: drawerOffset(i) + '%' }">
        <Suspense>
          <component :is="page.component" :current-stack="page" v-bind="page.route.params"> </component>
          <template #fallback>
            <div>Loading...</div>
          </template>
        </Suspense>
      </div>
      <button type="button" class="btn-close" @:click="close">
        <span class="icon-cross"></span>
        <span class="visually-hidden">Close</span>
      </button>
    </template>
  </TransitionGroup>
</template>

<style scoped lang="sass">
.drawer {
  position: absolute;
  right: 0;
  width: 95%;
  height: 100%;
  overflow-y: scroll;
  pointer-events: auto;
  background-color: #fff;
  transition: all 0.5s ease 0s;
  transform: translateX(0);
}

.drawer.v-enter-active,
.drawer.v-leave-active {
}

.drawer.v-enter-from,
.drawer.v-leave-to {
  transform: translateX(100%);
}

.background {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  background: #000;
  opacity: 0.4;
  pointer-events: auto;
}

.background div {
  height: 101%; /* Block body element scroll. */
}

.background.v-enter-active,
.background.v-leave-active {
  transition: opacity 1s ease-in-out;
}

.background.v-enter-from,
.background.v-leave-to {
  opacity: 0;
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
  pointer-events: auto;
  right:25px;
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
  transition: transform 150ms 300ms;
  transform: translateX(0);

.icon-cross {
@include cross(30px, #fff, 3px);
}

&:hover,
&:focus {
//transform: rotateZ(90deg);
  background: #888;
}
}

.btn-close.v-enter-from{
  transform: translateX(200%);
}
.btn-close.v-leave-to {
  transition: all 150ms;
  transform: translateX(200%);
}


.visually-hidden {
  display: none;
}
</style>
