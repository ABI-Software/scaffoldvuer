import { THREE } from 'zincjs';
import { RendererModule } from './RendererModule.js';
import Annotation from './Annotation.js';

// Current model's associate data, data fields, external link, nerve map
// informations,
// these are proived in the organsFileMap array.
const OrgansSceneData = function() {
  this.currentName = "";
  this.currentSystem = "";
  this.currentPart = "";
  this.currentSpecies  = "";
  this.metaURL = "";
  this.viewURL = "";
  this.timeVarying = false;
	this.currentTime = 0.0;
}

/**
 * Viewer of 3D-organs models. Users can toggle on/off different views. Data is
 * displayed instead if models are not available.
 * 
 * @class
 * @param {PJP.ModelsLoader}
 *            ModelsLoaderIn - defined in modelsLoade.js, providing locations of
 *            files.
 * @param {String}
 *            PanelName - Id of the target element to create the
 *            {@link PJP.OrgansViewer} on.
 * @author Alan Wu
 * @returns {PJP.OrgansViewer}
 */
 const OrgansViewer = function(ModelsLoaderIn)  {
  RendererModule.call(this);
  const _this = this;
	let pickerScene = undefined;
	this.sceneData = new OrgansSceneData();
	const timeChangedCallbacks = new Array();
	const sceneChangedCallbacks = new Array();
  const organPartAddedCallbacks = new Array();
	const organPartRemovedCallbacks = new Array();
  let finishDownloadCallback = undefined;
	const modelsLoader = ModelsLoaderIn;
  this.NDCCameraControl = undefined;
	_this.typeName = "Organ Viewer";

	this.getSceneData = function() {
	  return _this.sceneData;
	}

	/**
	 * Used to update internal timer in scene when time slider has changed.
	 */
	this.updateTime = function(value) {
    let duration = 6000;
    if (_this.scene)
      duration = _this.scene.getDuration();
    const actualTime = value / 100.0 * duration;
		if (!_this.sceneData.nerveMapIsActive) {
			if (pickerScene)
				pickerScene.setMorphsTime(actualTime);
			if (_this.scene)
				_this.scene.setMorphsTime(actualTime);
		}
		_this.sceneData.currentTime = value;
	}
	
	/**
	 * Update the time slider and other renderers/scenes when time has changed.
	 */
   const preRenderTimeUpdate = function() {
    let duration = 3000;
    if (_this.scene)
      duration = _this.scene.getDuration();
    const currentTime = _this.zincRenderer.getCurrentTime();
		for (let i = 0; i < timeChangedCallbacks.length;i++) {
			timeChangedCallbacks[i](currentTime);
		}
		if (!_this.sceneData.nerveMapIsActive && pickerScene)
			pickerScene.setMorphsTime(currentTime);
		if (_this.sceneData.nerveMap && _this.sceneData.nerveMap.additionalReader)
      _this.sceneData.nerveMap.additionalReader.setTime(currentTime / 
        duration);
		_this.sceneData.currentTime = currentTime / duration * 100.0;
  }

	this.getCurrentTime = function() {
		return _this.sceneData.currentTime;
	}

  this.toggleSyncControl = (flag, rotateMode) => {
    let cameraControl = this.scene.getZincCameraControls();
    if (flag) {
      cameraControl.resetView();
      this.NDCCameraControl = cameraControl.enableSyncControl();
      cameraControl.setRotationMode(rotateMode);
    } else {
      cameraControl.disableSyncControl();
      this.NDCCameraControl = undefined;
      cameraControl.setRotationMode("free");
    }
  }

  this.isSyncControl = () => {
    return this.NDCCameraControl !== undefined;
  }

  this.setSyncControlZoomToBox = (box) => {
    if (this.NDCCameraControl) {
      this.NDCCameraControl.zoomToBox(box, 2);
    }
  }

  this.setSyncControlCallback = (callback) => {
    if (this.NDCCameraControl) {
      this.NDCCameraControl.setEventCallback(callback);
    }
  }

  this.setSyncControlCenterZoom = (center, zoom) => {
    if (this.NDCCameraControl) {
      this.NDCCameraControl.setCenterZoom(center, zoom);
    }
  }
  
  const postRenderSelectedCoordinatesUpdate = function() {
    //It is animating, the coordinates may have been updated
    if (_this.zincRenderer.playAnimation && _this.liveUpdatesObjects) {
      _this.setupLiveCoordinates(_this.liveUpdatesObjects);
    }
    if (_this.selectedCenter) {
      const vector = new THREE.Vector3();
      vector.copy(_this.selectedCenter);
      const coord = _this.scene.vectorToScreenXY(vector);
      _this.selectedScreenCoordinates.x = coord.x;
      _this.selectedScreenCoordinates.y = coord.y;
    }
  }
	
	const preRenderUpdateCallback = function() {
		return function() {
      preRenderTimeUpdate();
		}
  }
  
  const postRenderUpdateCallback = function() {
		return function() {
      postRenderSelectedCoordinatesUpdate();
		}
	}
	
	 /**
		 * Add a callback which will be called when time has changed
		 */
	this.addTimeChangedCallback = function(callback) {
	  if (typeof(callback === "function"))
	    timeChangedCallbacks.push(callback);
	}
	
	this.setTexturePos = function(value) {
		if (_this.sceneData.nerveMap && _this.sceneData.nerveMap.additionalReader)
			_this.sceneData.nerveMap.additionalReader.setSliderPos(value);
	}

	this.addSceneChangedCallback = function(callback) {
	  if (typeof(callback === "function")) {
	    sceneChangedCallbacks.push(callback);
	  }
	}
	
	this.addOrganPartAddedCallback = function(callback) {
    if (typeof(callback === "function"))
      organPartAddedCallbacks.push(callback);
  }

	this.addOrganPartRemovedCallback = function(callback) {
    if (typeof(callback === "function"))
      organPartRemovedCallbacks.push(callback);
  }

  this.setFinishDownloadCallback = function(callback) {
    if (typeof(callback === "function"))
      finishDownloadCallback = callback;
  }

  this.unsetFinishDownloadCallback = function() {
    finishDownloadCallback = undefined;
  }

  this.getNamedObjectsToScreenCoordinates = function(name, camera) {
    const vector = new THREE.Vector3();
    vector.setFromMatrixPosition( obj.matrixWorld );
    const widthHalf = (width/2);
    const heightHalf = (height/2);
    vector.project(camera);
    vector.x = ( vector.x * widthHalf ) + widthHalf;
    vector.y = - ( vector.y * heightHalf ) + heightHalf;
    return vector;
  }

  const getIdObjectFromIntersect = function(intersected) {
    let id = undefined;
    let intersectedObject = undefined;
    if (intersected !== undefined) {
      let marker = false;
      if (intersected.object.userData && 
        intersected.object.userData.isMarker) {
        marker = true;
        intersectedObject = intersected.object.userData.parent.getMorph();
      } else {
        intersectedObject = intersected.object;
      }
      try {
        intersectedObject.userData.userData.annotation.data.lastActionOnMarker = marker;
      } finally { }
      if (intersectedObject) {
        if (intersectedObject.name) {
          id = intersectedObject.name;
        } else {
          const annotations = _this.getAnnotationsFromObjects(
            [intersectedObject]);
          if (annotations && annotations[0]) {
            id = annotations[0].data.group;
          }
        }
      }
    }
    return {"id":id, "object":intersectedObject};
  }
	 
	/**
	 * Callback function when a pickable object has been picked. It will then
	 * call functions in tissueViewer and cellPanel to show corresponding
	 * informations.
	 * 
	 * @callback
	 */
   const _pickingCallback = function() {
		return function(intersects, window_x, window_y) {
      const intersected = _this.getIntersectedObject(intersects);
      const idObject = getIdObjectFromIntersect(intersected);
			const extraData = {
				worldCoords: [
					intersected ? intersected.point.x : 0,
					intersected ? intersected.point.y : 0,
					intersected ? intersected.point.z : 0,
				],
				intersected,
			};
      const coords = { x: window_x, y: window_y };
      if (idObject.id) {
        if (idObject.object.userData.isGlyph) { 
          if (idObject.object.name) {
            _this.setSelectedByObjects([idObject.object], coords,
							extraData, true);
					} else {
            _this.setSelectedByZincObjects(idObject.object.userData.getGlyphset(),
							coords, extraData, true);
					}
        } else {
          _this.setSelectedByObjects([idObject.object], coords, extraData, true);
        }
        return;
      } else {
				_this.setSelectedByObjects([], coords, extraData, true);
			}
		}
	};
	
	/**
	 * Callback function when a pickable object has been hovered over.
	 * 
	 * @callback
	 */
   const _hoverCallback = function() {
		return function(intersects, window_x, window_y) {
      const intersected = _this.getIntersectedObject(intersects);
      const idObject = getIdObjectFromIntersect(intersected);
			const extraData = {
				worldCoords: [
					intersected ? intersected.point.x : 0,
					intersected ? intersected.point.y : 0,
					intersected ? intersected.point.z : 0,
				],
			}
      const coords = { x: window_x, y: window_y };
      if (idObject.id) {
        _this.displayArea.style.cursor = "pointer";
        _this.setHighlightedByObjects([idObject.object], coords, extraData, true);
        return;
      }
      else {
				_this.displayArea.style.cursor = "auto";
				_this.setHighlightedByObjects([], coords, extraData, true);
      }
		}
	};

	const changeOrganPartsVisibilityForScene = function(scene, name, value, type) {
		if (type == "all" || type == "geometries") {
			const geometries = scene.findGeometriesWithGroupName(name);
			for (let i = 0; i < geometries.length; i ++ ) {
				geometries[i].setVisibility(value);
			}
		}
		if (type == "all" || type == "glyphsets") {
			const glyphsets = scene.findGlyphsetsWithGroupName(name);
			for (let i = 0; i < glyphsets.length; i ++ ) {
				glyphsets[i].setVisibility(value);
			}
		}
		if (type == "all" || type == "pointsets") {
			const pointsets = scene.findPointsetsWithGroupName(name);
			for (let i = 0; i < pointsets.length; i ++ ) {
				pointsets[i].setVisibility(value);
			}
		}
		if (type == "all" || type == "lines") {
			const lines = scene.findLinesWithGroupName(name);
			for (let i = 0; i < lines.length; i ++ ) {
				lines[i].setVisibility(value);
			}
		}
	}

	/**
	 * Change visibility for parts of the current scene.
	 */
	this.changeGeometriesVisibility = function(name, value) {
		changeOrganPartsVisibilityForScene(_this.scene, name, value, 'geometries');
		if (pickerScene)
			changeOrganPartsVisibilityForScene(pickerScene, name, value, 'geometries');
	}

	/**
	 * Change visibility for parts of the current scene.
	 */
	this.changeGlyphsetsVisibility = function(name, value) {
		changeOrganPartsVisibilityForScene(_this.scene, name, value, 'glyphsets');
		if (pickerScene)
			changeOrganPartsVisibilityForScene(pickerScene, name, value, 'glyphsets');
	}

	/**
	 * Change visibility for parts of the current scene.
	 */
	this.changeLinesVisibility = function(name, value) {
		changeOrganPartsVisibilityForScene(_this.scene, name, value, 'lines');
		if (pickerScene)
			changeOrganPartsVisibilityForScene(pickerScene, name, value, 'lines');
	}

	/**
	 * Change visibility for parts of the current scene.
	 */
	this.changePointsetsVisibility = function(name, value) {
		changeOrganPartsVisibilityForScene(_this.scene, name, value, 'pointsets');
		if (pickerScene)
			changeOrganPartsVisibilityForScene(pickerScene, name, value, 'pointsets');
  }
  			
	/**
	 * Change visibility for parts of the current scene.
	 */
	this.changeOrganPartsVisibility = function(name, value, typeIn) {
		let type = "all";
		if (typeIn !== undefined)
			type = typeIn;
		changeOrganPartsVisibilityForScene(_this.scene, name, value, type);
		if (pickerScene)
			changeOrganPartsVisibilityForScene(pickerScene, name, value, type);
	}
	
	this.changeOrganPartsVisibilityCallback = function(name) {
		return function(value) {
			_this.changeOrganPartsVisibility(name, value);
		}
	}
			
	this.changeBackgroundColour = function(backgroundColourString) {
		const colour = new THREE.Color(backgroundColourString);
		if (_this.zincRenderer) {
			const internalRenderer = _this.zincRenderer.getThreeJSRenderer();
			internalRenderer.setClearColor( colour, 1 );
		}
	}

	const addOrganPart = function(systemName, partName, useDefautColour, zincObject) {
    for (let i = 0; i < organPartAddedCallbacks.length;i++) {
      organPartAddedCallbacks[i](zincObject, _this.scene.isTimeVarying());
    }
    if (useDefautColour)
      modelsLoader.setGeometryColour(zincObject, systemName, partName);
		const annotation = new Annotation();
    const region = zincObject.region.getFullPath();
		annotation.data = {species:_this.sceneData.currentSpecies, system:systemName,
      part:partName, group:zincObject.groupName, region: region, uuid:zincObject.uuid,
      lastActionOnMarker: false};
		zincObject.userData["annotation"] = annotation;
	}

	const removeOrganPart = function(systemName, partName, useDefautColour, zincObject) {
    for (let i = 0; i < organPartRemovedCallbacks.length;i++) {
      organPartRemovedCallbacks[i](zincObject);
    }
	}

	  /**
		 * New organs geometry has been added to the scene, add UIs and make
		 * sure the viewport is correct.
		 */
	  const _addOrganPartCallback = function(systemName, partName, useDefautColour) {
	    return function(zincObject) {
	    	addOrganPart(systemName, partName, useDefautColour, zincObject);
	    }
	  }

	  /**
		 * Organs geometry has been removed to the scene.
		 */
	  const _removeOrganPartCallback = function(systemName, partName, useDefautColour) {
	    return function(zincObject) {
	    	removeOrganPart(systemName, partName, useDefautColour, zincObject);
	    }
	  }
	  
	  const downloadCompletedCallback = function() {
		  return function() {
			  _this.settingsChanged();
			  _this.sceneData.timeVarying = _this.scene.isTimeVarying();
        if (finishDownloadCallback)
          finishDownloadCallback();
		  }
	  }
	  
	  const singleItemDownloadCompletedCallback = function(systemName, partName, useDefautColour) {
      return function(geometry) {
        addOrganPart(systemName, partName, useDefautColour, geometry);
        _this.settingsChanged();
      }
	  }
	  
	  /**
		 * Toggle data field displays. Data fields displays flow/pressure and      <button @click="play">Play</button>
		 * other activities of the organs.
		 */
	  this.updateFieldvisibility = function(dataFields, value) {
      for ( let i = 0; i < dataFields.length; i ++ ) {
        if (value != i) {
          const geometryName = dataFields[i].PartName;
          _this.changeOrganPartsVisibility(geometryName, false);
        }
      }
      if (value > -1) {
        const partName = dataFields[value].PartName;
        if ((_this.scene.findGeometriesWithGroupName(partName).length > 0) ||
          (_this.scene.findGlyphsetsWithGroupName(partName).length > 0)) {
          _this.changeOrganPartsVisibility(partName, true);
        } else {
          const partDetails = getOrganDetails(dataFields[value].SystemName, partName);
          if (partDetails != undefined) {
            _this.scene.loadMetadataURL(modelsLoader.getOrgansDirectoryPrefix() + "/" + partDetails.meta);
          }
        }
	    }
	  }
	  
	  /**
		 * Return an array containing name(s) of species that also contains the
		 * currently displayed organs.
		 * 
		 * @returns {Array} containing species name
		 */
	  this.getAvailableSpecies = function(currentSpecies, currentSystem, currentPart) {
	    const availableSpecies = new Array();
	    availableSpecies.push("none");
	    const keysArray = Object.keys(organsFileMap);
	    for (index in keysArray) {
	      const species = keysArray[index];
	      if (species != currentSpecies) {
	        if (organsFileMap[species].hasOwnProperty(currentSystem) &&
	            organsFileMap[species][currentSystem].hasOwnProperty(currentPart)) {
	          availableSpecies.push(species);
	        }
	      }
	    }
	    return availableSpecies;
	  }
	  
	  const setSceneData = function(speciesName, systemName, partName, organsDetails) {
      _this.sceneData.nerveMapIsActive = false;
      _this.sceneData.nerveMap = undefined;
      _this.sceneData.metaURL = "";
      _this.sceneData.viewURL = "";
      _this.sceneData.currentSpecies = speciesName;
      _this.sceneData.currentSystem = systemName;
			_this.sceneData.currentPart = partName;
			_this.sceneData.currentTime = 0.0;
			_this.sceneData.timeVarying = false;
      // This is used as title
      let name = "";
      if (speciesName)
        name = speciesName + "/";
      if (systemName)
        name = systemName + "/";
      if (partName)
        name = partName;
      _this.sceneData.currentName = name;
	  }

	  this.loadOrgansFromURL = function(url, speciesName, systemName, partName, viewURL, clearFirst) {
		  if (_this.zincRenderer) {
			  if (partName && (_this.sceneData.metaURL !== url)) {
			      setSceneData(speciesName, systemName, partName, undefined);
			      const name = _this.sceneData.currentName;
			      let organScene = _this.zincRenderer.getSceneByName(name);
			      if (organScene) {
              if (clearFirst)
			    	    organScene.clearAll();
			      } else {
			    	  organScene = _this.zincRenderer.createScene(name);
			      }
						_this.selectObjectOnPick = true;
			      for (let i = 0; i < sceneChangedCallbacks.length;i++) {
			    	  sceneChangedCallbacks[i](_this.sceneData);
			      }
			      if (viewURL && viewURL != "") {
			    	  _this.sceneData.viewURL = viewURL;
				      organScene.loadViewURL(_this.sceneData.viewURL);
			      } else {
			    	  _this.sceneData.viewURL = undefined;
            }
			      _this.sceneData.metaURL = url;
						organScene.addZincObjectAddedCallbacks(_addOrganPartCallback(systemName, partName, false));
			      organScene.addZincObjectRemovedCallbacks(_removeOrganPartCallback(undefined, partName, false));
						organScene.loadMetadataURL(url, undefined, downloadCompletedCallback());	      
			      _this.scene = organScene;
			      _this.zincRenderer.setCurrentScene(organScene);
			      _this.graphicsHighlight.reset();
			      const zincCameraControl = organScene.getZincCameraControls();
			      zincCameraControl.enableRaycaster(organScene, _pickingCallback(), _hoverCallback());
			      zincCameraControl.setMouseButtonAction("AUXILIARY", "ZOOM");
			      zincCameraControl.setMouseButtonAction("SECONDARY", "PAN");
			  }
		  }
	  }

    this.loadGLTFFromURL = function(url, partName, clearFirst) {
		  if (_this.zincRenderer) {
			  if (partName && (_this.sceneData.metaURL !== url)) {
			      setSceneData(undefined, undefined, partName, undefined);
			      const name = _this.sceneData.currentName;
			      let organScene = _this.zincRenderer.getSceneByName(name);
			      if (organScene) {
              if (clearFirst)
			    	    organScene.clearAll();
			      } else {
			    	  organScene = _this.zincRenderer.createScene(name);
			      }
			      for (let i = 0; i < sceneChangedCallbacks.length;i++) {
			    	  sceneChangedCallbacks[i](_this.sceneData);
			      }
  	    	  _this.sceneData.viewURL = undefined;
			      _this.sceneData.metaURL = url;
						organScene.addZincObjectAddedCallbacks(_addOrganPartCallback(undefined, partName, false));
			      organScene.addZincObjectRemovedCallbacks(_removeOrganPartCallback(undefined, partName, false));
						organScene.loadGLTF(url, undefined, downloadCompletedCallback());
			      _this.scene = organScene;
			      _this.zincRenderer.setCurrentScene(organScene);
			      _this.graphicsHighlight.reset();
			      const zincCameraControl = organScene.getZincCameraControls();
			      zincCameraControl.enableRaycaster(organScene, _pickingCallback(), _hoverCallback());
			      zincCameraControl.setMouseButtonAction("AUXILIARY", "ZOOM");
			      zincCameraControl.setMouseButtonAction("SECONDARY", "PAN");
			  }
		  }
	  }
	  	  
	  this.alignCameraWithSelectedObject = function(transitionTime) {
	    const objects = _this.graphicsHighlight.getSelected();
	    if (objects && objects[0] && objects[0].userData) {
	      _this.scene.alignObjectToCameraView(objects[0].userData, transitionTime);
	    }
	  }
	  
	  this.exportSettings = function() {
		  const settings = {};
		  settings.name = _this.instanceName;
		  if (_this.sceneData.currentSystem)
			  settings.system = _this.sceneData.currentSystem;
		  if (_this.sceneData.currentSpecies)
			  settings.species  = _this.sceneData.currentSpecies;
		  if (_this.sceneData.currentPart)
			  settings.part = _this.sceneData.currentPart;
		  settings.metaURL = _this.sceneData.metaURL;
		  if (_this.sceneData.viewURL)
			  settings.viewURL = _this.sceneData.viewURL;
		  settings.dialog = "Organ Viewer";
		  return settings;
	  }
	  
	  this.importSettings = function(settings) {
		  if (settings && (settings.dialog == this.typeName)) {
			  _this.setName(settings.name);
			  if (settings.metaURL !== undefined && settings.metaURL != "") {
				  _this.loadOrgansFromURL(settings.metaURL, settings.species,
					  settings.system, settings.part, settings.viewURL, true);
			  } else {
				  _this.loadOrgans(settings.species, settings.system, settings.part);
			  }
			  return true;
		  }
		  return false;
	  }
		
	/**
	 * initialise loading of the html layout for the organs panel, this is
	 * called when the {@link PJP.OrgansViewer} is created.
	 * 
	 * @async
	 */
	 const initialise = function() {
	   _this.initialiseRenderer(undefined);
	   if (_this.zincRenderer) {
       _this.zincRenderer.addPreRenderCallbackFunction(preRenderUpdateCallback());
       _this.zincRenderer.addPostRenderCallbackFunction(postRenderUpdateCallback());
     }
  }
	 
	initialise();

}

OrgansViewer.prototype = Object.create(RendererModule.prototype);
export {
	OrgansViewer
}
