/** Module for cucumber-junit-formatter before cucumber 6.0.0 */

"use strict;";

const xml = require('xml');
const utils = require('../util');
const MULTIPLIER=(require("cucumber/lib/time").MILLISECONDS_IN_NANOSECOND||1); // eslint-disable-line global-require


let ToXML=function(options) {
    this.result=[];
    this.withPackage=options.withPackage;
    this.propertiesInTestcase=options.propertiesInTestcase;
    this.processFeature=options.scenarioAsStep?this.scenarioAsTestcase:this.stepAsTestcase;
    this.result=[];
};

ToXML.prototype.generateXML=function(features) {
    this.result=[];
//    console.log(JSON.stringify(features,null,2)); // eslint-disable-line
    features.forEach(feature=>this.processFeature(feature,this.result));
    return xml({ testsuites: this.result }, {indent:'  ',declaration: { encoding: 'UTF-8' }});
};

ToXML.prototype.scenarioAsTestcase=function(feature,result) {
    let attr={name:feature.id};
    let testSuite=[{}];
    testSuite[0]._attr={...attr,...feature.elements.reduce((acc,element)=>{
        if (element.type==='scenario') {
            let rez=this.processScenarioAsTestcase(element,testSuite,feature);
            acc={
                tests:acc.tests+rez.tests,
                failures:acc.failures+rez.failures,
                skipped:acc.skipped+rez.skipped,
                errors:acc.errors+rez.errors,
                time:acc.time+rez.time
            };
        }
        return acc;
    },{tests:0,failures:0,skipped:0,errors:0,time:0})};
    testSuite[0]._attr.time=testSuite[0]._attr.time.toFixed(3);
    result.push({testsuite:testSuite});
    return testSuite._attr;
};

ToXML.prototype.processScenarioAsTestcase=function(feature,result) {
    let rez={tests:1,failures:0,skipped:0,errors:0,time:0};
    if (feature.type!=="scenario") {
        return rez;
    }
    let testCase=[{_attr:{classname:feature.id,name:feature.name}}];
    if (feature.tags && this.propertiesInTestcase) {
        testCase.push({properties:feature.tags.map(tag=>utils.createProperty("tag",tag.name))});
    }

    feature.steps.every(step=>{
        rez.time+=(step.result.duration || 0)/(1000*MULTIPLIER);
        rez.failures+=step.result.failures;
        rez.skipped+=step.result.skipped;
        rez.errors+=step.result.errors;

        if (step.hidden && !(step.result.errors || step.result.failuers || step.result.hidden)) {
            return true;
        }

        if (step.result.failures) {
            testCase.push({failure:[{_attr:{message:step.result.error_name}},step.result.error_message]});
            return false;
        }
        if (step.result.errors) {
            testCase.push({error:[{_attr:{message:step.result.error_name}},step.result.error_message]});
            return false;
        }
        if (step.result.skipped) {
            testCase.push({skipped:[]});
            return false;
        }
        return true;
    });
//    console.log(JSON.stringify(testCase,null,2)); // eslint-disable-line
    testCase[0]._attr.time=rez.time.toFixed(3);
    result.push({testcase:testCase});
    return rez;
};

ToXML.prototype.stepAsTestcase=function(feature,result,parent) { // eslint-disable-line no-unused-vars
    let attr=feature.elements.reduce((acc,element)=>{
        if (element.type==='scenario') {
            let rez=this.processScenarioAsTestsuite(element,result,feature);
            acc={
                tests:acc.tests+rez.tests,
                failures:acc.failures+rez.failures,
                skipped:acc.skipped+rez.skipped,
                errors:acc.errors+rez.errors,
                time:acc.time+rez.time
            };
        }
        return acc;
    },{tests:0,failures:0,skipped:0,errors:0,time:0});
    return attr;
};

ToXML.prototype.processScenarioAsTestsuite=function(feature,result,parent) {
    let rez={tests:0,failures:0,skipped:0,errors:0,time:0};
    if (feature.type!=="scenario") {
        return rez;
    }
    let testSuite=[{_attr:{name:`${parent.id};${feature.id}`}}];
    if (feature.tags) {
        testSuite.push({properties:feature.tags.map(tag=>utils.createProperty("tag",tag.name))});
    }
    if (this.withPackage) {
        rez.package=utils.convertNameToId(feature.id);
    }
    feature.steps.every(step=>{
        rez.time+=(step.result.duration || 0)/(1000*MULTIPLIER);
        rez.failures+=step.result.failures;
        rez.skipped+=step.result.skipped;
        rez.errors+=step.result.errors;

        if (step.hidden && !(step.result.errors || step.result.failuers || step.result.hidden)) {
            return true;
        }
        rez.tests+=1;
        let name=step.name || `${feature.name} ${step.keyword.trim().toLowerCase()}`;
        let id=utils.convertNameToId(name);
        let testCase=[{_attr:{classname:id,name:name,time:((step.result.duration || 0)/(1000*MULTIPLIER)).toFixed(3)}}];
        testSuite.push({testcase:testCase});
        if (step.result.failures) {
            testCase.push({failure:[{_attr:{message:step.result.error_name}},step.result.error_message]});
            return true;
        }
        if (step.result.errors) {
            testCase.push({error:[{_attr:{message:step.result.error_name}},step.result.error_message]});
            return true;
        }
        if (step.result.skipped) {
            testCase.push({skipped:[]});
            return true;
        }
        return true;
    });
//    console.log(JSON.stringify(testCase,null,2)); // eslint-disable-line
    testSuite[0]._attr={...testSuite[0]._attr,...rez};
    result.push({testsuite:testSuite});
    return rez;
};


module.exports=ToXML;
