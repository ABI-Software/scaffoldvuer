<template>
  <div :style="position" class="region-tooltip">
    <el-popover
      ref="tooltip"
      :visible="visible"
      placement="top"
      :show-arrow="false"
      :teleported="false"
      trigger="manual"
      popper-class="tooltip-popper non-selectable"
      virtual-triggering
      @hide="hideTriggered"
    >
      <template #default>
        <div class="tooltip-text">{{ label }}</div>
        <div class="tooltip-text" v-if="region">Region: {{ region }}</div>
        <CreateTooltipContent
          v-show="createData.toBeConfirmed"
          :createData="createData"
          @confirm-create="$emit('confirm-create', $event)"
          @cancel-create="$emit('cancel-create')"
        />
        <Tooltip
          class="p-tooltip"
          v-show="
            (annotationDisplay && !createData.toBeConfirmed) ||
            imageEntry.length
          "
          ref="tooltip"
          :tooltipType="annotationDisplay ? 'annotation' : 'image'"
          :annotationEntry="annotationEntry"
          :imageEntry="imageEntry"
        />
        <div v-if="createData.toBeDeleted" class="delete-container">
          <el-row>
            <el-col :span="10">Delete this feature?</el-col>
            <el-col :span="7">
              <el-button
                class="delete-button"
                :icon="ElIconDelete"
                @click="$emit('confirm-delete')"
                >
                  Delete
              </el-button>
            </el-col>
            <el-col :span="6">
              <el-button
                class="delete-button"
                @click="$emit('cancel-create')"
                >
                  Dismiss
              </el-button>
            </el-col>
          </el-row>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script>
import { shallowRef } from 'vue';
/* eslint-disable no-alert, no-console */
import {
  ElCol as Col,
  ElIcon as Icon,
  ElPopover as Popover,
  ElRow as Row,
} from "element-plus";
import {
  Delete as ElIconDelete,
} from '@element-plus/icons-vue'
import { mapState } from 'pinia';
import { useMainStore } from "@/stores/index";
import CreateTooltipContent from "./CreateTooltipContent.vue";
import { Tooltip } from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'

/**
 * A component to control the opacity of the target object.
 */
export default {
  name: "ScaffoldTooltip",
  components: {
    Col,
    CreateTooltipContent,
    ElIconDelete,
    Icon,
    Popover,
    Row,
    Tooltip,
  },
  props: {
    createData: {
      type: Object,
      default: {
        toBeConfirmed: false,
        points: [],
        shape: "",
        x: 0,
        y: 0,
      }
    },
    label: {
      type: String,
      default: "",
    },
    annotationDisplay: {
      type: Boolean,
      default: false,
    },
    region: {
      type: String,
      default: "",
    },
    visible: {
      type: Boolean,
      default: false,
    },
    x: {
      type: Number,
      default: 200,
    },
    y: {
      type: Number,
      default: 200,
    },
    imageThumbnails: {
      type: Object,
      default: {},
    },
    imageThumbnailSidebar: {
      type: Boolean,
      default: false,
    },
  },
  inject: ['scaffoldUrl'],
  provide() {
    return {
      userApiKey: this.userToken,
    };
  },
  data: function () {
    return {
      annotationEntry: { },
      ElIconDelete: shallowRef(ElIconDelete),
    };
  },
  computed: {
    ...mapState(useMainStore,  ['userToken']),
    position: function () {
      let yOffset = 40;
      if (this.region) {
        yOffset = 55;
      }
      const x = this.x - 40;
      return { left: x + "px", top: this.y - yOffset + "px" };
    },
    imageEntry: function () {
      let imageEntries = []
      const imageThumbnailsEntries = Object.assign({},
        Object.fromEntries(
          Object.entries(this.imageThumbnails)
            .filter(([key, value]) => value.length > 0)
            .map(([key, value]) => [key.toLowerCase(), value])))
      const lowerCaseLabel = this.label.toLowerCase()
      if (lowerCaseLabel in imageThumbnailsEntries) {
        imageEntries = imageThumbnailsEntries[lowerCaseLabel];
      }
      if (this.imageThumbnailSidebar) {
        if (imageEntries.length) {
          this.$emit('image-thumbnail-open', imageEntries)
        }
        return [];
      }
      return imageEntries;
    },
  },
  methods: {
    checkForDisplay: function () {
      if (this.visible && this.label && this.label !== "") {
        if (this.annotationDisplay) {
          const region = this.region ? this.region +"/" : "";
          this.annotationEntry = {
            "featureId": encodeURIComponent(region + this.label),
            "resourceId": encodeURIComponent(this.scaffoldUrl),
            "resource": encodeURIComponent(this.scaffoldUrl),
          };
        }
      } else {
        this.annotationEntry = { };
      }
    },
    hideTriggered: function() {
      if (this.createData.toBeConfirmed) {
        this.$emit('cancel-create');
      }
    },
  },
  watch: {
    label: {
      handler: function () {
        this.checkForDisplay();
      },
      immediate: true,
    },
    visible: {
      handler: function () {
        this.checkForDisplay();
      },
      immediate: true,
    },
    annotationDisplay: {
      handler: function () {
        this.checkForDisplay();
      },
      immediate: true,
    }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

.region-tooltip {
  position: absolute;
  height: 50px;
  z-index: 2;
  :deep(.tooltip-popper.el-popover.el-popper) {
    padding: 2px 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    font-size: 16px;
    color: $app-primary-color;
    background-color: #fff;
    border: 1px solid $app-primary-color;
    border-radius: 4px;
    white-space: nowrap;
    min-width: unset!important;
    max-width:330px;
    width:unset!important;
    pointer-events: none;
    top: -15px !important;
    .el-popper__arrow {
      &:before {
        border-color: $app-primary-color;
      }
    }
  }

  .tooltip-text {
    text-align: center;
    color: $app-primary-color;
  }

  :deep(.non-selectable) {
    user-select: none;
    pointer-events: none;
  }

  .p-tooltip {
    display: flex;
    width: 300px;
    white-space:normal;
    .attribute-content {
      color: rgb(44, 62, 80);
    }
    &::before, &::after {
      display:none;
    }
  }

  .delete-container {
    margin-top: 12px;
    margin-bottom: 12px;
    font-size: 14px;
    .delete-button {
      pointer-events: auto;
      cursor: pointer;
      margin-left:8px;
      padding-left: 8px;
      padding-right: 8px;
      height: 24px !important;
      color: $app-primary-color;
      &:hover {
        background-color: var(--el-color-primary-light-9);
      }
    }
  }
}
</style>
