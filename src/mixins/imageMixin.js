export default {
  methods: {
    populateMapWithImages: async function (images, type) {
      let imageMarkerLabels = {};
      for (const [key, list] of Object.entries(images)) {
        const response = await this.downloadImageThumbnail(key, list, type);
        if (response) {
          imageMarkerLabels[key] = response;
        }
      }
      return imageMarkerLabels;
    },
    downloadImageThumbnail: async function (key, list, type) {
      const count = list.length;
      if (count > 0) {
        //Pick a random image
        const index = Math.floor(Math.random() * count);
        const thumbnail = list[index].thumbnail;
        try {
          const response = await this.getImageThumbnail(thumbnail, type);
          const markerObject = await this.addImageThumbnailMarker(key, response);
          return markerObject;
        } catch (error) {
          // Failed to download, pick another one
          list.splice(index);
          this.downloadImageThumbnail(key, list, type);
        }
      }
    },
    getImageThumbnail: async function (url, type) {
      return new Promise((resolve, reject) => {
        if (type === "Image" || type === "Segmentation") {
          this.getBinaryThumbnail(url)
            .then((response) => resolve(response))
            .catch((response) => reject(response));
        } else {
          this.getGenericThumbnail(url)
            .then((response) => resolve(response))
            .catch((response) => reject(response));
        }
      });
    },
    getBinaryThumbnail: async function (url) {
      return new Promise((resolve, reject) => {
        fetch(url)
          .then((response) => {
            if (response.status >= 200 && response.status < 300) {
              return response.text();
            } else {
              reject();
            }
          })
          .then((data) => {
            if (data) {
              let img = new Image();
              img.onload = function () {
                resolve(`data:'image/png';base64,${data}`);
              };
              img.onerror = function () {
                reject(new Error("Failed to load image at " + url));
              };
              img.src = `data:'image/png';base64,${data}`;
            } else {
              reject(new Error("Failed to load image at " + url));
            }
          });
      });
    },
    getGenericThumbnail: async function (url) {
      return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = function () {
          resolve(url);
        };
        img.onerror = function () {
          reject(new Error("Failed to load image at " + url));
        };
        img.src = url;
      });
    },
    addImageThumbnailMarker: async function (id, source) {
      const blob = await (await fetch(source)).blob();
      const blobUrl = URL.createObjectURL(blob);
      return { number: this.markerLabels[id], imgURL: blobUrl };
    },
  },
};
