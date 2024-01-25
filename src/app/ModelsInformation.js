//import { google } from 'googleapis';
//const sheets = google.sheets('v4');

/* eslint-disable no-alert, no-console */
export default {
  data: function() {
    return {
      tableData: [],
    };
  },
  methods: {
    createTable: async function(sheetRows, keywords) {
      for (let i = 0; i < sheetRows.length; i++) {
        let mappedData = {};
        for (let j = 0; j < keywords.length; j++) {
          let keyword = keywords[j];
          mappedData[keyword] = sheetRows[i][keyword];
        }
        this.tableData.push(mappedData);
      }
    },
    getModelsInformation: async function() {

/*
      const serviceAccountAuth = new JWT({
        // env var values here are copied from service account credentials generated by google
        // see "Authentication" section in docs for more info
        email: import.meta.env.VITE_APP_GOOGLE_SERVICE_SCAFFOLDVUER_EMAIL,
        key: import.meta.env.VITE_APP_GOOGLE_PRIVATE_SCAFFOLDVUER_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const doc = new GoogleSpreadsheet(import.meta.env.VITE_GOOGLE_SPREADSHEET_ID, serviceAccountAuth);



      const doc = new GoogleSpreadsheet(import.meta.env.VITE_GOOGLE_SPREADSHEET_ID);
      await doc.useServiceAccountAuth({
        client_email: import.meta.env.VITE_APP_GOOGLE_SERVICE_SCAFFOLDVUER_EMAIL,
        private_key: import.meta.env.VITE_APP_GOOGLE_PRIVATE_SCAFFOLDVUER_KEY,
      });

      await doc.loadInfo(); // loads document properties and worksheets
      const sheet = doc.sheetsByIndex[0];
      const sheetRows = await sheet.getRows();
      const keys = ["Organ", "Species", "Note", "Location",
        "Last modified","Blackfynn dataset", "Published", "Discover"];
      this.createTable(sheetRows, keys);
            */

    }
  }
}
