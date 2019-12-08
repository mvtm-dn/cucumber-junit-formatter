/** Utility module  */

"use strict";

const {formatterHelpers} = require('cucumber');

module.exports={ 
// Next two methods taken from https://github.com/stjohnjohnson/cucumber-junit/blob/master/lib/cucumber_junit.js
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

    createFailure:(message)=>{
        return {
            failure: [
                { _attr: { message: message.split("\n").shift() } },
                message
            ]
        };
    },

    createFailureOrError:(type,exception)=>{
        let {name}=exception,
        ret ={};
        ret[type]=[
                { _attr: { message: name } },
                formatterHelpers.formatError(exception)
            ];
        return ret;
    },

    // Next one from original json_formatter
    convertNameToId:obj=>obj.replace(/ /g, '-').toLowerCase()
};
