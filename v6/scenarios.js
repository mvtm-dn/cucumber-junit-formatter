/** Module for cucumber-junit-formatter before cucumber 6.0.0 */

"use strict;";

const xml = require('xml');



let ToXML=function(options) {
    this.result=[];
    this.withPackage=options.withPackage;
    this.storeProperties=options.propertiesInTestcase;
    this.processScenario=options.scenarioAsStep?this.scenarioAsTestcase:this.stepAsTestcase;
    this.result=[];
};

ToXML.prototype.generateXML=function(features) {
    this.result=[];
//    console.log(JSON.stringify(features,null,2)); // eslint-disable-line
    features.forEach(feature=>this.processFeature(feature,this.result));
    return xml({ testsuites: this.result }, {indent:'  ',declaration: { encoding: 'UTF-8' }});
};

ToXML.prototype.processFeature=function(feature,result) {
    let attr={name:feature.id};
    let testSuite=[{}];
    testSuite[0]._attr={...attr,...feature.elements.reduce((acc,element)=>{
        if (element.type==='scenario') {
            let rez=this.processScenario(element,testSuite,feature);
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
    result.push({testsuite:testSuite});
    return testSuite._attr;
};

ToXML.prototype.scenarioAsTestcase=function(feature,result) {
    let rez={tests:1,failures:0,skipped:0,errors:0,time:0};
    let testCase=[{_attr:{classname:feature.id,name:feature.name}}];
    if (feature.type!=="scenario") {
        return rez;
    }
    feature.steps.every(step=>{
        rez.time+=(step.result.duration || 0)/1000;
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
    testCase[0]._attr.time=rez.time;
    result.push({testcase:testCase});
    return rez;
};

ToXML.prototype.stepAsTestcase=function(feature,result,parent) { // eslint-disable-line no-unused-vars
    throw new Error("Not implemented");
};

module.exports=ToXML;
