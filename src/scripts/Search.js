/******************************************************************************

Flatmap viewer and annotation tool

Copyright (c) 2019  David Brooks

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

******************************************************************************/


//==============================================================================

import MiniSearch from 'minisearch';

import { createUnqiuesFromObjects } from './Utilities';

//==============================================================================

// The properties of a feature we index and show

export const indexedProperties = [
    'label',
    'models',
    'source'
];

//==============================================================================

export class SearchIndex
{
    constructor()
    {
        this._searchEngine =  new MiniSearch({
            fields: ['path', 'name'],
            storeFields: ['path'],
            tokenize: (string, _fieldName) => string.split('"'), // indexing tokenizer
        });
        this._featureIds = [];
        this.zincObjects = [];
        this.regions = [];
    }

    indexMetadata(featureId, metadata)
    //================================
    {
        const textSeen = [];
        for (const prop of indexedProperties) {
            if (prop in metadata) {
                const text = metadata[prop];
                if (!textSeen.includes(text)) {
                    this.addTerm_(featureId, text);
                    textSeen.push(text);
                }
            }
        }
    }

    addZincObject(zincObject, id)
    //=======================
    {
        const path = zincObject.getRegion().getFullPath();
        const fullPath = path ? `${path}/${zincObject.groupName}` : zincObject.groupName;
        const item = { path: fullPath, name: zincObject.groupName, id };
        this._searchEngine.add(item, {fields: ['path', 'name']});
        this.zincObjects.push(zincObject);
    }

    removeZincObject(zincObject, id)
    //=======================
    {
        const path = zincObject.getRegion().getFullPath();
        const fullPath = path ? `${path}/${zincObject.groupName}` : zincObject.groupName;
        const item = { path: fullPath, name: zincObject.groupName, id };
        this._searchEngine.remove(item, {fields: ['path', 'name']});
        for (let i = 0; i < this.zincObjects.length; i++) {
          if (id === this.zincObjects[i].uuid) {
            this.zincObjects.splice(i, 1);
            return;
          }
        }
        
    }

    addRegion(region, id)
    //=======================
    {
        const item = { path: region.getFullPath(), name: region.getName(), id };
        this._searchEngine.add(item, {fields: ['path', 'name']});
        this.regions.push(region);
    }

    clearResults()
    //============
    {
        this._;
    }

    removeAll()
    //=======================
    {
        this._searchEngine.removeAll();
        this.zincObjects.length = 0;
        this.regions.length = 0;
    }

    auto_suggest(text)
    //================
    {
        const results = this._searchEngine.autoSuggest(text, {prefix: true});
        return results;
    }

    processResults(zincObjects, searchText) {
      const result = {
        regionPath: undefined,
        label: `Search Results for \"`,
      };
      if (Array.isArray(searchText)) {
        result.label += ','.join(searchText);
      } else {
        result.label += searchText;
      }
      result.label += `\"`;
      if (zincObjects.length === 1) {
        if (zincObjects[0].isRegion) {
          result.regionPath = zincObjects[0].getFullPath();
        } else if (zincObjects[0].isZincObject) {
          result.regionPath = zincObjects[0].getRegion().getFullPath();
          result.label = zincObjects[0].groupName;
        }
      }
      result["zincObjects"] = createUnqiuesFromObjects(zincObjects);
      return result;
    } 

    search(text) {
        const results = this._searchEngine.search(text, {prefix: true});
        const zincResults = this.zincObjects.filter(zincObject => results.map(r => r.id).includes(zincObject.uuid));
        const regionResults = this.regions.filter(region => results.map(r => r.id).includes(region.uuid));
        zincResults.push(...regionResults);
        return zincResults;
    }

    searchTerms(terms) {
      let results = [];
      terms.forEach(term => {
        const result = this.search(term);
        results.push(...result);
      });
    
      return results;
    }

    searchAndProcessResult(terms) {
      let zincObjectResults = [];
      if (Array.isArray(terms)) {
        zincObjectResults = this.searchTerms(terms);
      } else {
        zincObjectResults = this.search(terms);
      }
      return this.processResults(zincObjectResults, terms);
    }

}

//==============================================================================

class SearchResults
{
    constructor(results)
    {
        this.__results = results.sort((a, b) => (b.score - a.score));
        this.__featureIds = results.map(r => r.featureId);
    }

    get featureIds()
    {
        return this.__featureIds;
    }

    get results()
    {
        return this.__results;
    }
}

//==============================================================================
