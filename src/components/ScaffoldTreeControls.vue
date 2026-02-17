<template>
  <div class="tree-controls" :class="{ open: drawerOpen, close: !drawerOpen }">
    <div class="traditional-container">
      <slot name="treeSlot"></slot>
      <TreeControls
        mapType="scaffold"
        title="Regions"
        :isReady="isReady"
        :treeData="treeDataEntry"
        :active="active"
        :hover="hover"
        :showColourPicker="showColourPicker"
        @setColour="setColour"
        @checkChanged="checkChanged"
        @changeActive="changeActiveByNode"
        @changeHover="changeHoverByNode"
        ref="treeControls"
        @mouseleave="removeHover(true)"
      />
    </div>
    <div
      class="drawer-button"
      :class="{ open: drawerOpen, close: !drawerOpen }"
      @click="toggleDrawer"
    >
      <el-icon><el-icon-arrow-left /></el-icon>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { ArrowLeft as ElIconArrowLeft } from "@element-plus/icons-vue";
import {
  convertUUIDsToFullPaths,
  createListFromPrimitives,
  extractAllFullPaths,
  findObjectsWithNames,
} from "../scripts/Utilities.js";
import { TreeControls } from "@abi-software/map-utilities";
import "@abi-software/map-utilities/dist/style.css";
import { markRaw } from "vue";

const nameSorting = (a, b) => {
  const labelA = a.label.toUpperCase();
  const labelB = b.label.toUpperCase();
  if (labelA < labelB) {
    return -1;
  }
  if (labelA > labelB) {
    return 1;
  }
  return 0;
};

/**
 * A vue component for toggling visibility of various regions.
 */
export default {
  name: "ScaffoldTreeControls",
  components: {
    ElIconArrowLeft,
    TreeControls,
  },
  props: {
    /**
     * Enable/disable colour picker
     */
    showColourPicker: Boolean,
    isReady: Boolean,
  },
  data: function () {
    return {
      treeData: [
        { label: "Root", regionPath: "", id: undefined, children: [] },
      ],
      active: [],
      hover: [],
      drawerOpen: true,
      nodeNumbers: 0,
      module: undefined,
      //checkedRegions: [],
    };
  },
  computed: {
    treeDataEntry: function () {
      return this.treeData[0].children;
    },
  },
  watch: {
    treeDataEntry: {
      deep: true,
      handler: function (data) {
        if (this.isReady) {
          // Updated colour when scaffold is ready
          this.setColourField(data);
          // _helper is unchecked by default
          //this.checkedRegions = data.filter(region => region.label !== '_helper');
        }
      },
    },
    /*
    checkedRegions: {
      deep: true,
      handler: function (data) {
        if (this.isReady) {
          this.$emit('checked-regions', data);
        }
      },
    },
    */
  },
  methods: {
    addTreeItem: function (parentContainer, item, object) {
      //The following block prevent duplicate graphics with the same name
      if (parentContainer.some((child) => child.label === item.label)) {
        return;
      }
      // Set initial colour for the colourPicker
      Object.assign(item, { activeColour: this.getColour(item) });
      parentContainer.push(item);
      parentContainer.sort((a, b) => {
        return nameSorting(a, b);
      });
      this.nodeNumbers++;
      this.$nextTick(() => {
        const checked =
          this.$refs.treeControls.$refs.regionTree.getCheckedKeys();
        if (!checked.includes(item.id) && object.getVisibility()) {
          this.$refs.treeControls.$refs.regionTree.setChecked(item.id, true);
        }
      });
    },
    // find or create new region, region id is always prefixed with
    // '__r/'
    findOrCreateRegion: function (data, paths, prefix) {
      //check if root region has been set
      if (this.module && this.module.scene) {
        this.treeData[0].id = this.module.scene.getRootRegion().uuid;
        this.treeData[0].isRegion = true;
      }
      if (paths.length > 0) {
        const _paths = [...paths];
        let childRegionItem = data.children.find(
          (child) => child.label == _paths[0]
        );
        const path = prefix + "/" + paths[0];
        const region = this.module.scene
          .getRootRegion()
          .findChildFromPath(path);
        if (!childRegionItem) {
          childRegionItem = {
            label: _paths[0],
            id: region.uuid,
            children: [],
            regionPath: path,
            isRegion: true,
          };
          this.addTreeItem(data.children, childRegionItem, region);
          //Special case for helper region
          if (path === "/_helper") {
            this.$nextTick(() => {
              this.$refs.treeControls.$refs.regionTree.setChecked(childRegionItem.id, false);
            });
          }
        }
        _paths.shift();
        return this.findOrCreateRegion(childRegionItem, _paths, path);
      } else {
        return data;
      }
    },
    removeRegion: function (label) {
      if (this.treeData[0].children) {
        for (let i = 0; i < this.treeData[0].children.length; i++) {
          if (this.treeData[0].children[i].label === label) {
            this.treeData[0].children.splice(i, 1);
            this.nodeNumbers--;
            return;
          }
        }
      }
    },
    /**
     * This is called when a new zinc object is read into the scene.
     */
    zincObjectAdded: function (zincObject) {
      // Using the new uuid, the cavaet of that is graphics with
      // same groupName will have different uuid. So in the tree control
      // We use the first uuid found for a group of primitives with same
      // group names to represent all of them.
      const region = zincObject.region;
      if (region) {
        const paths = region.getFullSeparatedPath();
        const regionData = this.findOrCreateRegion(this.treeData[0], paths, "");
        if (zincObject.groupName) {
          if (regionData) {
            if (!regionData.children) {
              regionData.children = [];
            }
            const child = {
              disabled: false,
              label: zincObject.groupName,
              id: region.uuid + "/" + zincObject.uuid,
              isPrimitives: true,
              regionPath: zincObject.region.getFullPath(),
              isTextureSlides: zincObject.isTextureSlides ? true : false,
            };
            this.addTreeItem(regionData.children, child, zincObject);
          }
        }
      }
    },
    removeGroupFromRegionTreeData: function(region, groupName) {
      const paths = region.getFullSeparatedPath();
      const regionData = this.findOrCreateRegion(this.treeData[0], paths, "");
      for (let i = 0; i < regionData.children.length; i++) {
        if (regionData.children[i].label === groupName) {
          regionData.children.splice(i, 1);
          this.nodeNumbers--;
          return;
        }
      }
    },
    zincObjectRenamed: function(zincObject, oldName) {
      const objects = zincObject.region.findObjectsWithGroupName(oldName, false);
      if (objects.length < 1) {
        this.removeGroupFromRegionTreeData(zincObject.region, oldName);
      }
      this.zincObjectAdded(zincObject);
    },
    zincObjectRemoved: function(zincObject) {
      const group = zincObject.groupName;
      const objects = zincObject.region.findObjectsWithGroupName(group, false);
      if (objects.length === 0) {
        this.removeGroupFromRegionTreeData(zincObject.region, group);
      }
    },
    checkChanged: function (node, data) {
      const isRegion = node.isRegion;
      const isPrimitives = node.isPrimitives;
      const isChecked = data.checkedKeys.includes(node.id);
      const region = this.module.scene
        .getRootRegion()
        .findChildFromPath(node.regionPath);
      if (isRegion) {
        if (isChecked) {
          region.showAllPrimitives();
          //this.checkedRegions.push(node);
        } else {
          region.hideAllPrimitives();
          //this.checkedRegions = this.checkedRegions.filter(region => region.label !== node.label);
        }
      }
      if (isPrimitives) {
        const primitives = region.findObjectsWithGroupName(node.label);
        primitives.forEach((primitive) => {
          const visibility = isChecked && !node.disabled;
          primitive.setVisibility(visibility);
        });
      }
    },
    updateActiveUI: function (primitives) {
      this.active.length = 0;
      createListFromPrimitives(primitives, this.active);
    },
    changeActiveByPrimitives: function (primitives, propagate) {
      if (primitives && primitives.length > 0) {
        this.updateActiveUI(primitives);
        this.$emit("object-selected", primitives, propagate);
      } else {
        this.removeActive(propagate);
      }
      this.removeHover(propagate);
    },
    updateHoverUI: function (primitives) {
      this.hover.length = 0;
      createListFromPrimitives(primitives, this.hover);
    },
    changeHoverByPrimitives: function (primitives, propagate) {
      if (primitives && primitives.length > 0) {
        this.updateHoverUI(primitives);
        this.$emit("object-hovered", primitives, propagate);
      } else {
        this.removeHover(propagate);
      }
    },
    /**
     * Select a region by its name.
     */
    changeActiveByNames: function (names, regionPath, propagate) {
      const rootRegion = this.module.scene.getRootRegion();
      const targetObjects = findObjectsWithNames(
        rootRegion,
        names,
        regionPath,
        true
      );
      this.changeActiveByPrimitives(targetObjects, propagate);
    },
    /**
     * Hover a region by its name.
     */
    changeHoverByNames: function (names, regionPath, propagate) {
      const rootRegion = this.module.scene.getRootRegion();
      const targetObjects = findObjectsWithNames(
        rootRegion,
        names,
        regionPath,
        true
      );
      this.changeHoverByPrimitives(targetObjects, propagate);
    },
    changeActiveByNode: function (node, propagate) {
      if (node.isPrimitives || node.isRegion) {
        const transverse = node.isRegion ? true : false;
        const targetObjects = this.getZincObjectsFromNode(node, transverse);
        this.changeActiveByPrimitives(targetObjects, propagate);
      }
    },
    changeHoverByNode: function (node, propagate) {
      if (node.isPrimitives) {
        const targetObjects = this.getZincObjectsFromNode(node, false);
        this.changeHoverByPrimitives(targetObjects, propagate);
      }
    },
    /**
     * Unselect the current selected region.
     */
    removeActive: function (propagate) {
      this.active = [];
      this.$emit("object-selected", [], propagate);
    },
    /**
     * Unselect the current hover region.
     */
    removeHover: function (propagate) {
      this.hover = [];
      this.$emit("object-hovered", [], propagate);
    },
    /**
     * Reset the controls.
     */
    clear: function () {
      this.active.length = 0;
      this.hover.length = 0;
      this.nodeNumbers = 0;
      this.$refs.treeControls.$refs.regionTree.updateKeyChildren(
        this.treeData[0].id,
        []
      );
      this.treeData[0].children.length = 0;
      this.treeData[0].id = undefined;
      this.$emit("object-selected", []);
    },
    forEachChildInNode: function(node, checkedList, regionPath, parentsAreVisible, callback) {
      if (node.isRegion) {
        if (node.children) {
          const isVisible = regionPath === '' || checkedList.includes(node.id);
          node.children.forEach(
            child => this.forEachChildInNode(
              child, checkedList, node.regionPath, parentsAreVisible && isVisible, callback)
          );
        }
      } else if (node.isPrimitives) {
        callback(node, regionPath, parentsAreVisible);
      }
    },
    getColour: function (nodeData) {
      //Do not need to check for primitives as this is checked on the template
      if (nodeData) {
        const targetObjects = this.getZincObjectsFromNode(nodeData, false);
        let graphic = targetObjects[0];
        if (graphic) {
          let hex = graphic.getColourHex();
          if (hex) return "#" + hex;
        }
      }
      return "#FFFFFF";
    },
    getNodeDataByRegionAndGroup: function (regin, group) {
      for (const treeRegion of this.treeDataEntry) {
        if (treeRegion.isRegion && treeRegion.label === regin) {
          const treeGroups = treeRegion.children;
          for (const treeGroup of treeGroups) {
            if (treeGroup.isPrimitives && treeGroup.label === group) {
              return treeGroup;
            }
          }
        }
      }
      return undefined;
    },
    getZincObjectsFromNode: function (node, transverse) {
      const rootRegion = this.module.scene.getRootRegion();
      if (node.isPrimitives) {
        return findObjectsWithNames(
          rootRegion,
          node.label,
          node.regionPath,
          transverse
        );
      } else if (node.isRegion) {
        if (node.regionPath) {
          let targetRegion = rootRegion.findChildFromPath(node.regionPath);
          if (targetRegion) {
            return targetRegion.getAllObjects(transverse);
          }
        }
      }
      return [];
    },
    //Set this right at the beginning.
    setModule: function (moduleIn) {
      this.module = markRaw(moduleIn);
      this.nodeNumbers = 0;
      const objects = this.module.scene.getRootRegion().getAllObjects(true);
      objects.forEach((zincObject) => {
        this.zincObjectAdded(zincObject);
      });
      this.module.addOrganPartAddedCallback(this.zincObjectAdded);
      this.module.addOrganPartRemovedCallback(this.zincObjectRemoved);
    },
    setColourField: function (treeData, nodeData = undefined) {
      treeData
        .filter((data) => {
          // Filtering if single node is provided and it does not have children field
          if (nodeData && !data.children) {
            return data.id === nodeData.id;
          } else {
            return true;
          }
        })
        .map((data) => {
          // Using recursive to process nested data if children field exists
          if (data.children) {
            this.setColourField(data.children, nodeData);
          } else {
            const colour = this.getColour(data);
            // Default colour will be used for reset colour action
            if (!data.defaultColour) {
              data["defaultColour"] = colour;
            }
            // Active colour is used for current display
            data["activeColour"] = colour;
          }
        });
    },
    setColour: function (nodeData, value) {
      if (nodeData && nodeData.isPrimitives) {
        const targetObjects = this.getZincObjectsFromNode(nodeData, false);
        targetObjects.forEach((primitive) => {
          // Click clear will return null, so set it to the default colour
          const activeColour = value ? value : nodeData.defaultColour;
          let hexString = activeColour.replace("#", "0x");
          primitive.setColourHex(hexString);
          this.setColourField(this.treeData[0].children, nodeData);
        });
      }
    },
    updateAllNodeColours: function() {
      const checkedList =
        this.$refs.treeControls.$refs.regionTree.getCheckedKeys();
      this.forEachChildInNode(
        this.treeData[0],
        checkedList,
        "",
        true,
        (node, regionPath, parentsAreVisible) => {
          if (node.isPrimitives) {
            node.activeColour = this.getColour(node);
          }
        }
      );
    },
    setOutlines: function(flag) {
      const checkedList =
        this.$refs.treeControls.$refs.regionTree.getCheckedKeys();
      this.forEachChildInNode(
        this.treeData[0],
        checkedList,
        "",
        true,
        (node, regionPath, parentsAreVisible) => {
          const region = this.module.scene
              .getRootRegion()
              .findChildFromPath(regionPath);
          const primitives = region.findObjectsWithGroupName(node.label);
          if (flag) {
            primitives.forEach((primitive) => {
              if (primitive.isLines) {
                if (checkedList.includes(node.id) && parentsAreVisible) {
                  primitive.setVisibility(true);
                }
                node.disabled = false;
              }
            });
          } else {
            if (node.isPrimitives) {
              primitives.forEach((primitive) => {
                if (primitive.isLines) {
                  primitive.setVisibility(false);
                  node.disabled = true;
                }
              });
            }
          }
        }
      );
    },
    visibilityToggle: function (item, event) {
      this.module.changeOrganPartsVisibility(item, event);
      if (event == false) {
        if (this.activeRegion === item) {
          this.removeActive(true);
        }
        if (this.hoverRegion === item) {
          this.removeHover(true);
        }
      }
    },
    toggleDrawer: function () {
      this.drawerOpen = !this.drawerOpen;
      this.$emit("drawer-toggled", this.drawerOpen);
    },
    //Set visibility using full paths and add found id to the ids list
    //and remove item from list if remove is set to true.
    setTreeVisibilityWithFullPaths: function (node, list, ids, remove) {
      let flag = false;
      let nodeName = "";
      if (node.isRegion) {
        nodeName = `__r${node.regionPath}`;
      }
      if (node.isPrimitives) {
        nodeName = `${node.regionPath}/${node.label}`;
      }
      //Find the node in list, remove it from list if remove flag is on
      const index = list.indexOf(nodeName);
      if (index > -1) {
        flag = true;
        list.splice(index, 1);
        ids.push(node.id);
      }
      const region = this.module.scene
        .getRootRegion()
        .findChildFromPath(node.regionPath);
      if (nodeName && nodeName !== "__r") {
        if (node.isPrimitives) {
          const primitives = region.findObjectsWithGroupName(node.label);
          primitives.forEach((primitive) => primitive.setVisibility(flag));
        }
      }
      if (node.children) {
        node.children.forEach((child) => {
          this.setTreeVisibilityWithFullPaths(child, list, ids, true);
        });
      }
    },
    setCheckedKeys: function (ids, clear) {
      this.$nextTick(() => {
        if (clear) {
          this.$refs.treeControls.$refs.regionTree.setCheckedKeys([]); // Clear previous checked keys
        }
        // this will be faster as it only requires region node ids only
        // the number will be much less than all node ids
        ids.forEach((id) => {
          this.$refs.treeControls.$refs.regionTree.setChecked(id, true, true); // Set new checked keys
        })
      });
    },
    checkAllKeys: function (ignore = []) {
      const keysList = [];
      const ids = [];
      extractAllFullPaths(this.treeData[0], keysList);
      const modifiedKeysList = keysList.filter((key) => {
        return !ignore.some(item => key.includes(item));
      });
      this.setTreeVisibilityWithFullPaths(
        this.treeData[0],
        modifiedKeysList,
        ids,
        true
      );
      this.$refs.treeControls.$refs.regionTree.setCheckedKeys(ids);
    },
    getState: function () {
      let checkedItems =
        this.$refs.treeControls.$refs.regionTree.getCheckedKeys();
      if (checkedItems.length === this.nodeNumbers) {
        return { checkAll: true, version: "2.0" };
      } else {
        //We cannot use the generated uuid as the identifier for permastate,
        //convert it back to paths
        let paths = convertUUIDsToFullPaths(
          this.module.scene.getRootRegion(),
          checkedItems
        );
        return { checkedItems: paths, version: "2.0" };
      }
    },
    setState: function (state) {
      if (state) {
        if (state.checkAll) {
          this.checkAllKeys();
        } else if (state.checkedItems) {
          let list = [];
          if (state.version !== "2.0") {
            list = state.checkedItems.map((item) => "/" + item);
            list.shift("__r/");
          } else {
            list.push(...state.checkedItems);
          }
          const ids = [];
          this.setTreeVisibilityWithFullPaths(
            this.treeData[0],
            list,
            ids,
            true
          );
          this.$refs.treeControls.$refs.regionTree.setCheckedKeys(ids);
        }
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.tree-controls {
  position: absolute;
  bottom: 0px;
  transition: all 1s ease;

  &:focus {
    outline: none;
  }
  &.open {
    left: 0px;
    .traditional-container {
      opacity: 1;
    }
  }
  &.close {
    left: -298px;
    .traditional-container {
      pointer-events: none;
      opacity: 0;
    }
  }
}

.traditional-container {
  transition: all 1s ease;
  float: left;
  padding-left: 16px;
  padding-right: 18px;
  max-height: calc(100% - 154px);
  text-align: left;
  overflow: none;
  border: 1px solid rgb(220, 223, 230);
  padding-top: 7px;
  padding-bottom: 16px;
  background: #ffffff;
}

.drawer-button {
  float: left;
  width: 20px;
  height: 40px;
  z-index: 8;
  margin-top: calc(50% - 52px);
  border: solid 1px $app-primary-color;
  background-color: #f9f2fc;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  pointer-events: auto;
}

.drawer-button {
  i {
    font-weight: 600;
    margin-top: 12px;
    color: $app-primary-color;
    transition-delay: 0.9s;
  }
  &.open {
    i {
      transform: rotate(0deg) scaleY(2);
    }
  }
  &.close {
    i {
      transform: rotate(180deg) scaleY(2);
    }
  }
}

.drawer-button.open i {
  transform: rotate(0deg) scaleY(2.5);
}

.drawer-button.close i {
  transform: rotate(180deg) scaleY(2.5);
}
</style>
