# vue-stacked-ui

## Description
`vue-stacked-ui` provides "Stacked UI" at the top of vue-router(v4).
It is possible to realize a UI that allows users to drill down through data, sometimes seen in dashboards.

Following features,

* Allows infinite number of pages to be stacked.
* URL-first design. (URL representing stack state)
* Browser history support.
* Route params passed to page by vue-router.
* Provides callback to block when "pop" Stack.


## Demo
[vue-stacked-ui Demo](https://vue-stacked-ui.netlify.app/)


## Requirement
* Vue 3
* vue-router 4


## Install

```
npm install vue-stacked-ui
```

## Usage

### (Preparation) Load plugin in `main.ts`

```typescript
import router from './router'
import { stackedUI } from 'vue-stacked-ui'
import 'vue-stacked-ui/dist/vue-stacked-ui.css'
// Then use it as Vue plugin.
app.use(stackedUI, {router: router});
```

### (Preparation) Add comonent tags in App.vue

```typescript
<StackRootView />
<!-- Reserve Drawer Area  -->
<div id="drawer_wrapper">
  <StackView />
</div>
<!-- Reserve Drawer Area -->
    
```

### (Use) Control stack

```html
<StackPush to="/about">stack push component</StackPush>
<StackPop>stack push component</StackPop>
```

### (Use) Programatically control stack

```typescript
import { useStack } from "vue-stacked-ui"
const stack = useStack(); 
stack.push("/about/hoge")
stack.pop()
```

### (Use) Register onBeforePop callback if you need.

```typescript
props.currentStack?.onBeforePop(() => {
  return confirm("Realy close stack?")
});
```

### (Use) Register Global Navigation Guards (Recommended)

This is the recommended way to register navigation guards from anywhere, even before stack initialization:

```typescript
// In your router/index.ts or similar file
import { registerBeforeEachGuard } from "vue-stacked-ui"

// Register a global guard that will be applied to the stack
// Works even if called before the stack is initialized
registerBeforeEachGuard((to, from) => {
  console.log(`Global guard: Navigating to ${to.path}`);
  
  // Works with any authentication library
  if (to.path.includes('admin') && !isAuthenticated()) {
    return '/login';
  }
  
  return true;
});
```

### (Use) Navigation Guards with beforeEach

If you have access to the stack instance, you can register navigation guards directly:

```typescript
import { useStack } from "vue-stacked-ui"
const stack = useStack();

// Register a navigation guard similar to vue-router's beforeEach
// This will be called before any stack navigation (push, pop, replace)
stack.beforeEach((to, from) => {
  // Access the route information
  console.log(`Navigating from ${from?.name} to ${to.name}`);
  
  // Cancel navigation by returning false
  if (to.path.includes('forbidden')) {
    return false;
  }
  
  // Redirect to another route by returning a route location
  if (to.path.includes('redirect')) {
    return '/alternative-page';
  }
  
  // Allow navigation by returning true or undefined
  return true;
});
```

## Licence

[MIT](https://github.com/tcnksm/tool/blob/master/LICENCE)

## Author

[iridge-mu](https://github.com/mu-iridge)
