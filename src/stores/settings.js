import { defineStore } from "pinia";

/* eslint-disable no-alert, no-console */

export const useSettingsStore = defineStore("settings", {
  state: () => {
    return {
      organCuries: [],
      imageTypes: [],
      imageThumbnails: {},
    };
  },
  getters: {
    imageTypeCached: (state) => (imageType) => {
      return state.imageTypes.includes(imageType);
    },
    getImageThumbnails:
      (state) =>
        (imageType, uberonIds = undefined) => {
          if (uberonIds) {
            let thumbnails = {};
            Object.entries(state.imageThumbnails).forEach(([key, value]) => {
              if (uberonIds.includes(key)) {
                thumbnails[key] = value.filter((item) => item.type === imageType);
              }
            });
            return thumbnails;
          }
          return state.imageThumbnails;
        },
  },
  actions: {
    updateOrganCuries(organCuries) {
      this.organCuries = organCuries;
    },
    updateImageThumbnails(imageType, imageThumbnails) {
      this.imageTypes.push(imageType);
      Object.keys(imageThumbnails).forEach((key) => {
        if (!(key in this.imageThumbnails)) {
          this.imageThumbnails[key] = [];
        }
        this.imageThumbnails[key].push(...imageThumbnails[key]);
      });
    },
  },
});
