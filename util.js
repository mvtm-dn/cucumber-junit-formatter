/** Utility module  */

"use strict";


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
     * Convert name to id. Just replace all spaces to '-' and translate to lowercase
     * @param {String} obj
     * @return {String} id from name
     */
    convertNameToId:obj=>obj.replace(/\s/g, '-').toLowerCase()
    
};
