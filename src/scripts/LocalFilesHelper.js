const getRelativePath = (from, to) => {
  const fromParts = from.split('/').filter(Boolean);
  const toParts = to.split('/').filter(Boolean);
  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }
  const upSteps = new Array(fromParts.length).fill('..');
  return [...upSteps, ...toParts].join('/') || '.';
};

const processTextureFile = (textureData, flatarray, objectURLs, filesMapping) => {
  if (textureData && textureData.images && textureData.images.source) {
    const images = textureData.images.source;
    for (let i = 0; i < images.length; i++) {
      const index = flatarray.findIndex((element) => {
        return element[0].includes(images[i]);
      });
      if (index > -1) {
        const objectURL = URL.createObjectURL(flatarray[index][1]);
        objectURLs.push(objectURL);
        textureData.images.source[i] = objectURL;
        filesMapping[objectURL] = images[i];
      }
    }
    const content = JSON.stringify(textureData);
    let blob = new Blob([content], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }
};

const getJSON = async (URL) => {
  return fetch(URL)
    .then((response) => response.json())
    .then((responseJson) => {
      return responseJson;
    });
};

const createMetadataObjectURLs = async (text, list, flatarray) => {
  let content = text;
  const objectURLs = [];
  const filesMapping = [];
  for (const [key, file] of Object.entries(list)) {
    if (content.includes(key)) {
      const objectURL = URL.createObjectURL(file);
      const re = new RegExp(key, 'g');
      content = content.replace(re, objectURL);
      objectURLs.push(objectURL);
      filesMapping[objectURL] = key;
    }
  }
  const data = JSON.parse(content);
  for (let i = 0; i < data.length; i++) {
    if (data[i] && data[i].Type) {
      if (data[i].Type === 'Texture') {
        const textureData = await getJSON(data[i].URL);
        URL.revokeObjectURL(data[i].URL);
        const newURL = processTextureFile(textureData, flatarray, objectURLs, filesMapping);
        data[i].URL = newURL;
      }
    }
  }
  let newContent = JSON.stringify(data);
  let blob = new Blob([newContent], { type: 'application/json' });
  const metaURL = URL.createObjectURL(blob);
  objectURLs.push(metaURL);
  return {
    objectURLs,
    filesMapping,
    url: metaURL,
    format: 'metadata',
  };
};

const createNiftiURL = (content, zipped) => {
  let type = zipped ? 'application/x-gzip' : 'image/nii';
  let blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  return url;
};

const isPLYFile = (file) => /\.ply$/i.test(file.name);

const isGLTFFile = (file) => /\.(gltf|glb)$/i.test(file.name);

//Wrap dropped PLY and glTF files in an in-memory metadata file so they are
//read through the regular metadata path. ZincJS presents PLY files with faces
//as surfaces and PLY files with vertices only as points, the regions and
//objects of glTF files come from the files themselves.
const createFilesMetadataURL = (files) => {
  const objectURLs = [];
  const filesMapping = {};
  const data = files.map((file) => {
    const objectURL = URL.createObjectURL(file);
    objectURLs.push(objectURL);
    filesMapping[objectURL] = file.name;
    if (isGLTFFile(file)) {
      return {
        Type: 'glTF',
        URL: objectURL,
      };
    }
    return {
      Type: 'Surfaces',
      FileFormat: 'PLY',
      URL: objectURL,
      GroupName: file.name.replace(/\.ply$/i, ''),
    };
  });
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const metaURL = URL.createObjectURL(blob);
  objectURLs.push(metaURL);
  return {
    objectURLs,
    filesMapping,
    url: metaURL,
    format: 'metadata',
  };
};

const createURLFromFiles = async (flatarray) => {
  let list = {};
  let rootPath = '';
  let metadata = undefined;
  for (let i = 0; i < flatarray.length; i++) {
    if (flatarray[i][1].name.includes('metadata.json')) {
      rootPath = flatarray[i][0].replace(flatarray[i][1].name, '');
      metadata = { rootPath, file: flatarray[i][1] };
      break;
    }
  }
  if (metadata) {
    flatarray.forEach(([filePath, file]) => {
      //PLY and glTF files may be referenced by metadata with FileFormat set
      //to PLY and Type set to glTF respectively
      if (file.name.match(/\.(json)$/) || isPLYFile(file) || isGLTFFile(file)) {
        const relativePath = getRelativePath(rootPath, filePath);
        list[relativePath] = file;
      }
    });
    const metaFileURL = URL.createObjectURL(metadata.file);
    try {
      const response = await fetch(metaFileURL);
      if (!response.ok) {
        throw new Error('Cant process local file');
      }
      const text = await response.text();
      URL.revokeObjectURL(metaFileURL);
      return await createMetadataObjectURLs(text, list, flatarray);
    } catch (error) {
      console.error('Fetch failed:', error);
    }
  }
  const files = flatarray
    .map(([, file]) => file)
    .filter((file) => isPLYFile(file) || isGLTFFile(file));
  if (files.length > 0) {
    return createFilesMetadataURL(files);
  }
};

export { createNiftiURL, createURLFromFiles };
