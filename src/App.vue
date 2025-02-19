<template>
  <div id="app">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Asap:400,400i,500,600,700&display=swap" />
    <drop-zone ref="dropzone" @files-drop="onFilesDrop">
      <ScaffoldVuer
        v-if="url"
        ref="scaffold"
        class="vuer"
        :flatmapAPI="flatmapAPI"
        :display-u-i="displayUI"
        :url="url"
        :help-mode="helpMode"
        :helpModeDialog="useHelpModeDialog"
        :helpModeActiveItem="helpModeActiveItem"
        @help-mode-last-item="onHelpModeLastItem"
        @shown-tooltip="onTooltipShown"
        @shown-map-tooltip="onMapTooltipShown"
        :display-latest-changes="true"
        :display-minimap="displayMinimap"
        :display-markers="displayMarkers"
        :enableOpenMapUI="true"
        :marker-cluster="markerCluster"
        :minimap-settings="minimapSettings"
        :show-colour-picker="showColourPicker"
        :render="render"
        :region="region"
        :view-u-r-l="viewURL"
        :format="format"
        :marker-labels="markerLabels"
        :enableLocalAnnotations="false"
        @open-map="openMap"
        @on-error="onError"
        @on-ready="onReady"
        @scaffold-selected="onSelected"
        @scaffold-navigated="onNavigated"
        @user-primitives-updated="userPrimitivesUpdated"
        @timeChanged="updateCurrentTime"
        @zinc-object-added="objectAdded"
        @vue:mounted="viewerMounted"
      />
    </drop-zone>

    <HelpModeDialog
      v-if="helpMode && useHelpModeDialog"
      ref="scaffoldHelp"
      :scaffoldRef="scaffoldRef"
      :lastItem="helpModeLastItem"
      @show-next="onHelpModeShowNext"
      @finish-help-mode="onFinishHelpMode"
    />

    <el-popover popper-class="options-container" placement="bottom" trigger="click" width="500" :teleported="false">
      <div>

        <el-row :gutter="20">
          <el-col>
            <p>{{ selectedCoordinates }}</p>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="currentTime !== 0">
          <el-col>
            <p>
              time emited is: {{ currentTime.toFixed(2) }}
            </p>
          </el-col>
        </el-row>

        <el-row :gutter="20" justify="center" align="middle">
          <el-col :span="auto">
            <el-switch v-model="displayUI" active-text="UI" />
          </el-col>
          <el-col :span="auto">
            <el-switch v-model="displayMarkers" active-text="Markers" active-icon-class="el-icon-location"
              active-color="#8300bf" />
          </el-col>
          <el-col :span="auto">
            <el-switch v-model="markerCluster" active-text="Marker Cluster" active-icon-class="el-icon-location"
              active-color="#8300bf" />
          </el-col>
          <el-col :span="auto">
            <el-switch v-model="displayMinimap" active-text="Minimap" active-icon-class="el-icon-discover"
              active-color="#8300bf" />
          </el-col>
        </el-row>

        <el-row :gutter="20" justify="center" align="middle">
          <el-col :span="auto">
            <el-switch v-model="tumbleOn" active-text="Tumble" active-color="#8300bf" />
          </el-col>
          <el-col :span="auto">
            <el-row>
              <el-col :span="8"> x: </el-col>
              <el-col :span="16">
                <el-input-number class="tumble-direction" controls-position="right" v-model="tumbleDirection[0]" :min="-1.0"
                  :max="1.0" :controls="false" placeholder="Please input" aria-label="x" @change="autoTumble" />
              </el-col>
            </el-row>
          </el-col>
          <el-col :span="auto">
            <el-row>
              <el-col :span="8"> y: </el-col>
              <el-col :span="16">
                <el-input-number class="tumble-direction" controls-position="right" v-model="tumbleDirection[1]" :min="-1.0"
                  :max="1.0" :controls="false" placeholder="Please input" aria-label="y" @change="autoTumble" />
              </el-col>
            </el-row>
          </el-col>
        </el-row>

        <el-row :gutter="20" justify="center" align="middle">
          <el-col :span="auto">
            <el-button size="small" @click="helpMode = !helpMode">
              Help Mode
            </el-button>
          </el-col>
          <el-col :span="auto">
            <el-button size="small" @click="screenCapture()"> Capture </el-button>
          </el-col>
        </el-row>

        <el-row :gutter="20" justify="center" align="middle">
          <el-col :span="auto">
            <el-button size="small" @click="saveSettings()">
              Save Settings
            </el-button>
          </el-col>
          <el-col :span="auto">
            <el-button size="small" @click="restoreSettings()">
              Restore Settings
            </el-button>
          </el-col>
          <el-col :span="auto">
            <el-button size="small" @click="exportGLB()"> Export GLB </el-button>
          </el-col>
          <el-col :span="auto">
            <el-button size="small" @click="exportGLTF()"> Export GLTF </el-button>
          </el-col>
        </el-row>

        <el-row :gutter="20" justify="center" align="middle">
          <el-col :span="auto">
            <el-button size="small" @click="exportLocalAnnotations()">
              Export Annotations
            </el-button>
          </el-col>
          <el-col :span="auto">
              <el-button size="small">
                <label for="annotations-upload">Import Annotations</label>
                <input
                  id="annotations-upload"
                  type="file"
                  accept="application/json"
                  @change="importLocalAnnotations" 
                />
              </el-button>
          </el-col>
        </el-row>

        <el-row :gutter="20" justify="center" align="middle">
          <el-col :span="auto">
            <el-button size="small" @click="alignCameraWithAxis('front')">
              Front Plane
            </el-button>
          </el-col>
          <el-col :span="auto">
            <el-button size="small" @click="alignCameraWithAxis('back')">
              Back Plane
            </el-button>
          </el-col>
          <el-col :span="auto">
            <el-button size="small" @click="alignCameraWithAxis('left')">
              Left Plane
            </el-button>
          </el-col>
          <el-col :span="auto">
            <el-button size="small" @click="alignCameraWithAxis('right')">
              Right Plane
            </el-button>
          </el-col>
          <el-col :span="auto">
            <el-button size="small" @click="alignCameraWithAxis('up')">
              Up Plane
            </el-button>
          </el-col>
          <el-col :span="auto">
            <el-button size="small" @click="alignCameraWithAxis('down')">
              Down Plane
            </el-button>
          </el-col>
        </el-row>

        <el-row justify="center" align="middle">
          <el-col>
            <el-row :gutter="20" justify="center" align="middle">
              <el-col>
                <el-switch v-model="syncMode" active-text="Sync Mode" active-color="#8300bf" />
              </el-col>
            </el-row>
            <el-row :gutter="20" justify="center" align="middle" v-if="syncMode">
              <el-col :span="8">
                <el-input-number v-model="zoom" :min="1.0" :controls="false" placeholder="Please input" aria-label="zoom" />
              </el-col>
              <el-col :span="8">
                <el-input-number v-model="pos[0]" :min="-1.0" :max="1.0" :controls="false" placeholder="Please input" aria-label="x" />
              </el-col>
              <el-col :span="8">
                <el-input-number v-model="pos[1]" :min="-1.0" :max="1.0" :controls="false" aria-label="y" />
              </el-col>
            </el-row>
          </el-col>
        </el-row>

        <el-row :gutter="20" justify="center" align="middle">
          <el-col :span="auto">
            <el-switch v-model="render" active-text="Rendering" active-color="#8300bf" />
          </el-col>
          <el-col :span="auto">
            <el-switch v-model="renderInfoOn" active-text="Renderer Info" active-color="#8300bf" />
          </el-col>
          <el-button size="small" @click="PrintViewport()">
              Print Viewport
            </el-button>
        </el-row>

        <template v-if="renderInfoOn && rendererInfo">
          <el-row :gutter="20" justify="center" align="middle">
            <el-col v-for="(value, name) in rendererInfo.memory" :key="name" :span="auto">
              {{ name }} : {{ value }}
            </el-col>
          </el-row>
          <el-row :gutter="20" justify="center" align="middle">
            <el-col v-for="(value, name) in rendererInfo.render" :key="name" :span="auto">
              {{ name }} : {{ value }}
            </el-col>
          </el-row>
        </template>

        <el-row justify="center" align="middle">
          <el-col>
            <el-row :gutter="20" justify="center" align="middle">
              <el-col>
                <p>Feature Demo:</p>
              </el-col>
            </el-row>
            <el-row :gutter="20" justify="center" align="middle">
              <el-col :span="auto">
                <el-button size="small" @click="featureTextureVolume(false)">
                  Texture volume
                </el-button>
              </el-col>
              <el-col :span="auto">
                <el-button size="small" @click="featureTextureSlides(false)">
                  Texture slides
                </el-button>
              </el-col>
              <el-col :span="auto">
                <el-button size="small" @click="featureTextureVolume(true)">
                  Body volume
                </el-button>
              </el-col>
              <el-col :span="auto">
                <el-button size="small" @click="featureTextureSlides(true)">
                  Body slides
                </el-button>
              </el-col>
              <el-col :span="auto">
                <el-button size="small" @click="featureArmSlides(true)">
                  Arm slides
                </el-button>
              </el-col>
            </el-row>
            <el-row :gutter="20" justify="center" align="middle">
              <el-col :span="auto">
                <el-switch
                  v-model="onClickMarkers"
                  active-text="Markers On Selection"
                  active-color="#8300bf"
                />
              </el-col>
              <el-col :span="auto">
                <el-switch
                  v-model="wireframe"
                  active-text="Wireframe"
                  active-color="#8300bf"
                  @change="wireframeChanged"
                />
              </el-col>
            </el-row>
          </el-col>
        </el-row>

        <el-row :gutter="20" justify="center" align="middle">
          <el-col :span="24">
            <el-input
              v-model="input"
              type="textarea"
              :autosize="{ minRows: 3 }"
              placeholder="Please input"
            />
          </el-col>
        </el-row>

      </div>
      <template #reference>
        <el-button class="options-button" :icon="ElIconSetting">
          Options
        </el-button>
      </template>
    </el-popover>
    <el-popover placement="bottom" trigger="click" width="800" popper-class="table-popover" :teleported="false">
      <template #default>
        <Suspense>
          <ModelsTable @viewModelClicked="viewModelClicked" />
        </Suspense>
      </template>
      <template #reference>
        <el-button class="models-button" :icon="ElIconFolderOpened">
          Models
        </el-button>
      </template>
    </el-popover>
    <el-autocomplete v-model="searchText" class="search-box" placeholder="Search" :fetch-suggestions="fetchSuggestions"
      :teleported="false" popper-class="autocomplete-popper" @keyup.enter="search(searchText)"
      @select="search(searchText)">
      <template #default="{ item }">
        <div class="value">
          {{ item.value }}
        </div>
      </template>
    </el-autocomplete>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { AnnotationService } from '@abi-software/sparc-annotation'
import { markRaw, shallowRef } from 'vue';
import { ScaffoldVuer } from "./components/index.js";
import DropZone from "./app/DropZone.vue";
import ModelsTable from "./app/ModelsTable.vue";
import { testArmSlides, testSlides, testVolume } from "./app/TextureDemos.js";
import {
  FolderOpened as ElIconFolderOpened,
  Setting as ElIconSetting,
} from '@element-plus/icons-vue'
import {
  ElAutocomplete as Autocomplete,
  ElButton as Button,
  ElCol as Col,
  ElIcon as Icon,
  ElInput as Input,
  ElInputNumber as InputNumber,
  ElPopover as Popover,
  ElRow as Row,
  ElUpload as Upload,
  ElSwitch as Switch,
} from "element-plus";
import { useRoute, useRouter } from 'vue-router'
import { HelpModeDialog } from '@abi-software/map-utilities'
import '@abi-software/map-utilities/dist/style.css'

let texture_prefix = undefined;

const writeTextFile = (filename, data) => {
  let dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(data));
  let hrefElement = document.createElement("a");
  document.body.append(hrefElement);
  hrefElement.download = filename;
  hrefElement.href = dataStr;
  hrefElement.click();
  hrefElement.remove();
} 

export default {
  name: "app",
  components: {
    Autocomplete,
    Button,
    Col,
    Icon,
    Input,
    InputNumber,
    Popover,
    Row,
    Switch,
    Upload,
    ElIconFolderOpened,
    ElIconSetting,
    DropZone,
    ScaffoldVuer,
    ModelsTable,
    HelpModeDialog,
  },
  provide() {
    return {
      $annotator: this.annotator,
    }
  },
  data: function () {
    return {
      consoleOn: true,
      createLinesWithNormal: false,
      url: undefined,
      input: undefined,
      displayUI: true,
      selectedCoordinates: undefined,
      helpMode: false,
      displayMarkers: false,
      onClickMarkers: false,
      wireframe: false,
      syncMode: false,
      currentTime: 0,
      displayMinimap: false,
      tumbleOn: false,
      tumbleDirection: [1.0, 0.0],
      showColourPicker: true,
      markerCluster: false,
      minimapSettings: {
        x_offset: 16,
        y_offset: 50,
        width: 128,
        height: 128,
        align: "top-right",
      },
      markerLabels: { },
      render: true,
      region: "",
      viewURL: "",
      renderInfoOn: false,
      rendererInfo: undefined,
      zoom: 1,
      pos: [0, 0],
      format: "metadata",
      sceneSettings: [],
      searchInput: "",
      searchText: "",
      loadTextureVolumeOnReady: false,
      readyCallback: undefined,
      flatmapAPI: "https://mapcore-demo.org/devel/flatmap/v4/",
      helpMode: false,
      helpModeActiveItem: 0,
      helpModeLastItem: false,
      useHelpModeDialog: true,
      scaffoldRef: null,
      route: useRoute(),
      router: useRouter(),
      ElIconSetting: shallowRef(ElIconSetting),
      ElIconFolderOpened: shallowRef(ElIconFolderOpened),
      auto: NaN,
      annotator: markRaw(new AnnotationService(`https://mapcore-demo.org/devel/flatmap/v4/annotator`)),
      panelAxis: {}
    };
  },
  watch: {
    input: function () {
      this.parseInput();
    },
    tumbleOn: function () {
      this.autoTumble();
    },
    markerCluster: function(val) {
      if (val) {
        this.markerLabels = {
          "body proper": 9,
          "Spinal cord": 8,
          "lung": 11,
          "stomach": {number:12, imgURL: 'https://mapcore-bucket1.s3.us-west-2.amazonaws.com/texture/arm1/jpg/0984.jpg'},
          "urinary bladder": 11,
          "Brainstem": 11,
          "heart": 9,
          "skin epidermis": 5,
          "Diaphragm": 7,
          "colon": 9,
          "vagus nerve": 3,
          "myenteric nerve plexus": 2,
          "esophagus": 1,
          "urethra": 3
        };
      } else {
        this.markerLabels = { };
      }
    },
    "route.query": {
      handler: "parseQuery",
      deep: true,
      immediate: true,
    },
    syncMode: function (val) {
      this.$refs.scaffold.toggleSyncControl(val);
    },
    helpMode: function (newVal) {
      if (!newVal) {
        this.helpModeActiveItem = 0;
      }
    },
  },
  mounted: function () {
    this._objects = [];
  },
  created: function () {
    texture_prefix = import.meta.env.VITE_TEXTURE_FOOT_PREFIX;
  },
  unmounted: function () {
    this.$refs.dropzone.revokeURLs();
  },
  methods: {
    alignCameraWithAxis: function (direction) {
      this.$refs.scaffold.alignCameraWithAxis(this.panelAxis[direction]);
    },
    exportGLTF: function () {
      this.$refs.scaffold.exportGLTF(false).then((data) => {
        const filename = 'export' + JSON.stringify(new Date()) + '.gltf';
        writeTextFile(filename, data);
      });
    },
    exportGLB: function () {
      this.$refs.scaffold.exportGLTF(true).then((data) => {
        let blob = new Blob([data], { type: "octet/stream" });
        let url = window.URL.createObjectURL(blob);
        let hrefElement = document.createElement("a");
        document.body.append(hrefElement);
        hrefElement.download = `export.glb`;
        hrefElement.href = url;
        hrefElement.click();
        hrefElement.remove();
      });
    },
    exportLocalAnnotations: function() {
      const annotations = this.$refs.scaffold.getLocalAnnotations();
      const filename = 'scaffoldAnnotations' + JSON.stringify(new Date()) + '.json';
      writeTextFile(filename, annotations);
    },
    onReaderLoad: function(event) {
      const annotationsList = JSON.parse(event.target.result);
      this.$refs.scaffold.importLocalAnnotations(annotationsList);
    },
    importLocalAnnotations: function() {
      const selectedFile = document.getElementById("annotations-upload").files[0];
      const reader = new FileReader();
      reader.onload = this.onReaderLoad;
      reader.readAsText(selectedFile);
    },
    objectAdded: function (zincObject) {
      if (this.consoleOn) {
        console.log(zincObject)
        console.log(this.$refs.scaffold.$module.scene.getBoundingBox())
      }
      if (zincObject.isGeometry) {
        zincObject._lod._material.wireframe = this.wireframe;
      }
      this._objects.push(zincObject);
    },
    openMap: function (map) {
      if (this.consoleOn) {
        console.log(map);
      }
    },
    featureTextureVolume: async function (overlap) {
      //this.$refs.scaffold.clearScene();
      //volume matrix to fit the human body
      //[-100, 0, 0, 0, 0, -100, 0, 0, 0, 0, -100, 0, -60, -100, 30, 1]
      if (overlap) {
        const url =
          "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/6-match-2023/human/nerve_metadata.json";
        if (this.route.query.url !== encodeURI(url)) {
          this.router.replace({ path: "/", query: { url } });
          this.readyCallback = testVolume;
          return;
        } else {
          testVolume(this.$refs.scaffold, texture_prefix);
          return;
        }
      }
      this.$refs.scaffold.clearScene();
      testVolume(this.$refs.scaffold, texture_prefix);
    },
    featureTextureSlides: async function (overlap) {
      //Test texture
      if (overlap) {
        const url =
          "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/WholeBody/6-match-2023/human/nerve_metadata.json";
        if (this.route.query.url !== encodeURI(url)) {
          this.router.replace({ path: "/", query: { url } });
          this.readyCallback = testSlides;
          return;
        } else {
          testSlides(this.$refs.scaffold, texture_prefix);
          return;
        }
      }
      this.$refs.scaffold.clearScene();
      testSlides(this.$refs.scaffold, texture_prefix);
    },
    featureArmSlides: async function (overlap) {
      //Test texture
      if (overlap) {
        const url =
          "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/texture/arm1/arm_texture_metadata.json";
        if (this.route.query.url !== encodeURI(url)) {
          this.router.replace({ path: "/", query: { url } });
          this.readyCallback = testArmSlides;
          return;
        } else {
          testArmSlides(this.$refs.scaffold);
          return;
        }
      }
      this.$refs.scaffold.clearScene();
      testSlides(this.$refs.scaffold, texture_prefix);
    },
    saveSettings: function () {
      this.sceneSettings.push(this.$refs.scaffold.getState());
    },
    restoreSettings: function () {
      if (this.sceneSettings.length > 0)
        this.$refs.scaffold.setState(this.sceneSettings.pop());
    },
    viewModelClicked: function (location) {
      this.input = location;
    },
    userPrimitivesUpdated: function (event) {
      console.log(event);
    },
    screenCapture: function () {
      this.$refs.scaffold.captureScreenshot("capture.png");
    },
    setSceneToWindo: function () {
      window.scene = this.$refs.scaffold.$module.scene;
    },
    search: function (term) {
      this.$refs.scaffold.search(term, true);
    },
    viewerMounted: function() {
      this.selectedCoordinates =
        this.$refs.scaffold.getDynamicSelectedCoordinates();
      this.rendererInfo = this.$refs.scaffold.getRendererInfo();
    },
    PrintViewport: function() {
      const scene = this.$refs.scaffold.$module.scene;
      console.log(scene.getZincCameraControls().getCurrentViewport());
    },
    fetchSuggestions: function (term, cb) {
      if (term === "" || !this.$refs.scaffold) {
        cb([]);
      }
      cb(
        this.$refs.scaffold.fetchSuggestions(term).map((item) => {
          const value = item.suggestion;
          return {
            value: value,
            label: value
          };
        })
      );
      if (this.consoleOn) {
        console.log(
          "found suggestions",
          this.$refs.scaffold.fetchSuggestions(term)
        );
      }
    },
    autoTumble: function () {
      const flag = this.tumbleOn;
      let cameracontrol =
        this.$refs.scaffold.$module.scene.getZincCameraControls();
      if (flag) {
        this.displayUI = false;
        cameracontrol.enableAutoTumble();
        if (this.tumbleDirection[0] === 0 && this.tumbleDirection[1] === 0) {
          this.tumbleDirection[0] = 1;
        }
        cameracontrol.autoTumble(this.tumbleDirection, Math.PI / 2, true);
      } else {
        this.displayUI = true;
        cameracontrol.stopAutoTumble();
      }
    },
    wireframeChanged: function (value) {
      this._objects.forEach((zincObject) => {
        if (zincObject.isGeometry) {
          zincObject._lod._material.wireframe = value;
        }
      });
    },
    onError: function(payload) {
      if (payload?.type === "download-error") {
        const dropZone = this.$refs.dropzone;
        if (dropZone) {
          const realFilename = dropZone.findRealFilename(payload.xhr.responseURL);
          if (realFilename) {
            console.error(`External Resource ${realFilename}`);
          }
        }
      }
    },
    onReady: function () {
      if (this.consoleOn) console.log(this.$refs.scaffold)
      if (this.readyCallback) {
        this.readyCallback(this.$refs.scaffold, texture_prefix);
        this.readyCallback = undefined;
      } else {
        const url =
          "https://mapcore-bucket1.s3.us-west-2.amazonaws.com/texture/arm1/arm_texture_metadata.json";
        if (this.route.query.url === encodeURI(url)) {
          testArmSlides(this.$refs.scaffold);
        }
      }
      this.scaffoldRef = this.$refs.scaffold;
      // this.scaffoldRef.changeViewingMode('Annotation')
      this.panelAxis = this.scaffoldRef.getPlaneAxis()
    },
    addLinesWithNormal: function (coord, normal) {
      if (coord && normal) {
        const newCoords = [
          coord[0] + normal.x * 1000,
          coord[1] + normal.y * 1000,
          coord[2] + normal.z * 1000,
        ];
        const returned = this.$refs.scaffold.$module.scene.createLines(
          "test",
          "lines",
          [newCoords, coord],
          0x00ee22,
        );
        returned.zincObject.isEditable = true;
        if (this.consoleOn) console.log(returned);
      }
    },
    onSelected: function (data) {
      if (data && data.length > 0 && data[0].data.group) {
        if (this.consoleOn) console.log(data[0], data[0].extraData.intersected);
        if (this.createLinesWithNormal && data[0].extraData.worldCoords &&
          data[0].extraData.intersected?.face) {
          this.addLinesWithNormal(data[0].extraData.worldCoords, data[0].extraData.intersected.face.normal)
        }
        delete this.route.query["viewURL"];
        //this.$refs.scaffold.showRegionTooltipWithAnnotations(data, false, true);
        if (this.onClickMarkers) this.$refs.scaffold.setMarkerModeForObjectsWithName(data[0].data.group, "on");
      }
      if (this.consoleOn) console.log(data);
    },

    onNavigated: function (data) {
      this.zoom = data.zoom;
      this.pos[0] = data.target[0];
      this.pos[1] = data.target[1];
    },
    onFilesDrop: function (payload) {
      if (payload.format == "gltf") this.format = "gltf";
      else this.format = "metadata";
      this.input = payload.url;
    },
    parseInput: function () {
      if (this.route.query.url !== this.input) {
        const queries = { ...this.route.query };
        if (this.input && this.input !== "") queries.url = this.input;
        this.router.replace({
          path: "/",
          query: { ...this.route.query, url: this.input },
        });
      }
    },
    updateCurrentTime: function (val) {
      this.currentTime = val;
    },
    parseQuery: function (query) {
      this.router.isReady().then(() => {
        if (query.url != this.url) {
          this._objects = [];
        }
        if (query.url) {
          this.url = query.url;
        } else {
          this.url =
            "https://mapcore-bucket1.s3-us-west-2.amazonaws.com/others/29_Jan_2020/heartICN_metadata.json";
        }
        if (this.url.includes(".gltf") || this.url.includes(".glb")) {
          this.format = "gltf";
        } else if (this.url.includes(".json")) {
          this.format = "metadata";
        }
        this.input = this.url;
        if (query.region) {
          this.region = query.region;
        } else {
          this.region = "";
        }
        if (query.viewURL) {
          this.viewURL = query.viewURL;
        } else {
          this.viewURL = "";
        }
      })
    },
    onHelpModeShowNext: function () {
      this.helpModeActiveItem += 1;
    },
    onHelpModeLastItem: function (isLastItem) {
      if (isLastItem) {
        this.helpModeLastItem = true;
      }
    },
    onFinishHelpMode: function () {
      this.helpMode = false;
      // reset help mode to default values
      this.helpModeActiveItem = 0;
      this.helpModeLastItem = false;
    },
    onTooltipShown: function () {
      if (this.$refs.scaffold && this.$refs.scaffoldHelp) {
        this.$refs.scaffoldHelp.toggleTooltipHighlight();
      }
    },
    onMapTooltipShown: function () {
      if (this.$refs.scaffold && this.$refs.scaffoldHelp) {
        this.$refs.scaffoldHelp.toggleTooltipPinHighlight();
      }
    },
  },
};
</script>

<style lang="scss">

#app {
  font-family: "Asap", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  width: 100%;
  position: absolute;
  overflow: hidden;
}

body {
  margin: 0px;
}

.options-container.el-popover.el-popper {
  text-align: center;

  .el-row {
    .el-col {
      &.is-guttered {
        padding-top: 10px;
        padding-bottom: 10px;
      }

      > p {
        font-size: 12px;
        margin: 0;
      }

      .el-input__inner,
      .el-switch {
        font-size: 12px;
        height: 20px;
      }
    }
  }

  .el-switch {
    white-space: pre;

    .el-switch__label {
      color: inherit;

      * {
        font-size: 12px;
      }
    }
  }
}

.vuer {
  position: absolute;
  width: 100%;
  height: 100%;
}

.options-button {
  top: 5px;
  right: 10px;
  position: absolute;
}

.autocomplete-popper {
  li {
    line-height: normal;
    padding: 7px;

    .value {
      text-align: left;
      white-space: initial;
    }
  }
}

.search-box {
  width: 200px;
  left: calc(50% + 100px);
  position: absolute;
  top: 5px;
}

.models-button {
  position: absolute;
  top: 5px;
}

.tumble-direction {
  height: 20px;

  .el-input {
    width: 80px;
    height: 20px;
    padding: 0;

    input {
      padding: 0px;
      height: 20px;
      vertical-align: top;
    }
  }
}

.table-popover {
  opacity: 0.9;
}

svg.map-icon {
  color: $app-primary-color;
}

input[type="file"] {
  display: none;
}

</style>
