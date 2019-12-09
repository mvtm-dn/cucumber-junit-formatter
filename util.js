/** Utility module  */

"use strict";

const {formatterHelpers} = require('cucumber');

const _=require("lodash"); 

module.exports={ 
// Next two methods taken from https://github.com/stjohnjohnson/cucumber-junit/blob/master/lib/cucumber_junit.js

    /** 
     * Create property tag definiton
     * @param {String} name property name
     * @param {String|Number} value property value
     * @return {Object} property
     */
    createProperty:(name, value)=>{
        return {
            property: [
                {
                    _attr: {
                        name: name,
                        value: value
                    }
                }
            ]
        };
    },

    /**
     * Create failure tag definition
     * @param {String} message failure message
     * @return {Object} failure tag 
     */
    createFailure:(message)=>{
        return {
            failure: [
                { _attr: { message: message.split("\n").shift() } },
                message
            ]
        };
    },

    /**
     * Create failure or error tag
     * @param {String} type tag name
     * @param {Error} exception exception
     * @return {Object} generated tag
     */
    createFailureOrError:(type,exception)=>{
        let {name}=exception,
        ret ={};
        ret[type]=[
                { _attr: { message: name } },
                formatterHelpers.formatError(exception)
            ];
        return ret;
    },

    /**
     * Convert name to id. Just replace all spaces to '-' and translate to lowercase
     * @param {String} obj
     * @return {String} id from name
     */
    convertNameToId:obj=>obj.replace(/\s/g, '-').toLowerCase(),

    /** 
     * Format table. 
     * Check if we can replace _.map whti row.cells.map(..)
     * @param {Object} dataTable
     * @return {Object}
     */
    formatDataTable:dataTable=>{
        return {
          rows: dataTable.rows.map(row=>({ cells: _.map(row.cells, 'value') }))
        };
    },

    /** Format doc-string
     * @param {Object} docString
     * @return {Object} formatted string
     */
    formatDocString:docString=>{
        return {
          content: docString.content,
          line: docString.location.line
        };
    },
    /** 
     * Return tags
     * @param {Object} obj
     * @return {Object|Array} tag list
     */
    getTags:obj=>_.map(obj.tags, tagData=>({
            name: tagData.name,
            line: tagData.location.line
            })
        ),

    /**
     * Get feature data
     * @param {Object} feature 
     * @param {Object} uri 
     * @return {Object} feature data
     */
    getFeatureData(feature, uri) {
        return {
            description: feature.description,
            keyword: feature.keyword,
            name: feature.name,
            line: feature.location.line,
            id: module.exports.convertNameToId(feature.name), 
            tags: module.exports.getTags(feature),
            uri
        };
    }
    
    
};
