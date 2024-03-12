# Live demo

<div class="demo-map-container">
  <div class="demo-map-container-inner">
    <ClientOnly>
      <ScaffoldVuer style="height:100%;width:100%;"
        :url="url"
        :helpMode="helpMode"
        :displayMarkers="displayMarkers"
        :displayMinimap="displayMinimap"
        :minimapSettings="minimapSettings" />
    </ClientOnly>
  </div>
</div>

<script setup>
import { defineClientComponent } from 'vitepress'

const ScaffoldVuer = defineClientComponent(() => {
  return import('../src/components/ScaffoldVuer.vue')
})
</script>

<script>
export default {
  data: function() {
    return {
      url: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/29_Jan_2020/heartICN_metadata.json",
      helpMode: false,
      displayMarkers: true,
      displayMinimap: false,
      minimapSettings: {
        x_offset: 16,
        y_offset: 16,
        width: 128,
        height: 128,
        align: "bottom-right"
      },
    };
  }
}
</script>

<style>
  .demo-map-container {
    width: 100%;
    height: 0;
    padding-bottom: 75%;
    border: 1px solid var(--vp-c-divider);
    position: relative;
    z-index: 1; /* just for demo, to prevent tooltips go out of container */
    overflow: hidden;
  }

  .demo-map-container-inner {
    width: 100%;
    height: 100%;
    position: absolute;
  }

  .bottom-right-control {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }

  .zoomOut,
  .fitWindow {
    padding-left: 0px !important;
  }
</style>

## Code Preview

```js-vue
<div style="height:720px;width:680px;">
  <ScaffoldVuer style="height:100%;width:100%;"
    :url="url"
    :helpMode="helpMode"
    :displayMarkers="displayMarkers"
    :displayMinimap="displayMinimap"
    :minimapSettings="minimapSettings" />
</div>


<script>
import {ScaffoldVuer} from "abi-software/scaffolduver";
import "@abi-software/scaffoldvuer/dist/style.css";

export default {
  components: { ScaffoldVuer },
  data: function() {
    return {
      url: "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/29_Jan_2020/heartICN_metadata.json",
      helpMode: false,
      displayMarkers: true,
      displayMinimap: false,
      minimapSettings: {
        x_offset: 16,
        y_offset: 16,
        width: 128,
        height: 128,
        align: "bottom-right"
      },
    };
  }
}
</script>
```

