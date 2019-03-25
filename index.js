const { Formatter, formatterHelpers } = require('cucumber');
const xml = require('xml');

// Next two methods taken from https://github.com/stjohnjohnson/cucumber-junit/blob/master/lib/cucumber_junit.js
let createProperty=(name, value)=>{
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

    createFailure=(message)=>{
        return {
            failure: [
                { _attr: { message: message.split("\n").shift() } },
                message
            ]
        };
    },
    
    createFailureOrError=(type,exception)=>{
        let {name}=exception,
        ret ={};
        ret[type]=[
                { _attr: { message: name } },
                formatterHelpers.formatError(exception)
            ];
        return ret;
    },
    
    // Next one from original json_formatter
    convertNameToId=(obj)=>{
        return obj.replace(/ /g, '-').toLowerCase();
    };

class JUnitFormatter extends Formatter {
  /** @param {Options} options */
  constructor(options) {
    super(options);
    this._result=[];
    
    let scenarioAsSuite=({ sourceLocation })=>{    
      const { gherkinDocument, pickle, testCase } = options.eventDataCollector.getTestCaseData(sourceLocation);
      let testSuiteId=`${convertNameToId(gherkinDocument.feature.name)};${convertNameToId(pickle.name)}`;
      let attr={name:testSuiteId,tests:0,failures:0,skipped:0,errors:0,time:testCase.result.duration||0},
          testSuite=[{_attr:attr}];
          
      if (options.withPackage) {
        attr.package=convertNameToId(pickle.name);
      }
          
      if (pickle.tags.length) {
        testSuite.push({properties:pickle.tags.map(tag=>createProperty("tag",tag.name))});
      }
      
      testCase.steps.forEach((step,index)=>{
        const {gherkinKeyword, pickleStep } = options.eventDataCollector.getTestStepData({testCase:testCase,index:index});
        if (gherkinKeyword || (step.result && step.result.status==='failed')) {
            let result=step.result || {};
            let testCaseId=convertNameToId(gherkinKeyword?pickleStep.text:`${pickle.name} ${index?'after':'before'}`);
            let testCase=[
                {
                    _attr:{
                        classname:testCaseId,
                        name:gherkinKeyword?pickleStep.text:(pickle.name+(index?' after':' before')),
                        time:((result.duration || 0)/1000).toFixed(3)
                    }
                }
            ];
            switch (result.status) {
                case 'passed':
                    break;
                case 'failed':
                    testCase.push(createFailureOrError(gherkinKeyword?"failure":"error",result.exception));
                    if (gherkinKeyword) {
                        attr.failures+=1;
                    }
                    else {
                        attr.errors+=1;
                    }
                    break;
                case 'pending':
                case 'undefined':
                    testCase.push(createFailure(result.status === 'pending' ? 'Pending' 
                            : `Undefined step. Implement with the following snippet:\n  ${gherkinKeyword.trim()}(/^${pickleStep.text}$/, function(callback) {\n      // Write code here that turns the phrase above into concrete actions\n      callback(null, 'pending');\n  });`
                    ));
                    attr.failures+=1;
                    break;
                case 'skipped':
                    testCase.push({skipped: []});
                    attr.skipped+=1;
                    break;
                case 'ambiguous':
                    testCase.push(createFailureOrError("error",result.exception));
                    attr.errors+=1;
                    break;
                default:
                    break;
//                    testCase.push(createFailure(`Unknown status - ${step.result.status}`));
            }
            attr.tests+=1;
            testSuite.push({testcase:testCase});
        }
      });
      this._result.push({testsuite:testSuite});
    
    };
    
    let scenarioAsStep=({ sourceLocation })=>{    
      const { gherkinDocument, pickle, testCase } = options.eventDataCollector.getTestCaseData(sourceLocation);
      let testSuiteId=`${convertNameToId(gherkinDocument.feature.name)}`,
          testCaseId=`${convertNameToId(pickle.name)}`;
      let attr,testSuite;
      if (this._result.length && this._result[this._result.length-1].testsuite[0]._attr.name===testSuiteId) {
          testSuite=this._result[this._result.length-1].testsuite;
          attr=testSuite[0]._attr;
      }
      else {
          attr={name:testSuiteId,tests:0,failures:0,skipped:0,errors:0,time:0};
          testSuite=[{_attr:attr}];
          this._result.push({testsuite:testSuite});
      }
      attr.time+=testCase.result.duration;
      attr.tests+=1;
      let testCaseTag=[
        {
            _attr:{
                classname:testCaseId,
                name:pickle.name,
                time:((testCase.result.duration ||0)/1000).toFixed(3)
            }
        }
      ];

      if (pickle.tags.length) {
          testCaseTag.push({properties:pickle.tags.map(tag=>createProperty("tag",tag.name))});
      }
      
      testCase.steps.every((step,index)=>{
        const {gherkinKeyword, pickleStep } = options.eventDataCollector.getTestStepData({testCase:testCase,index:index});
        if (gherkinKeyword || (step.result && step.result.status==='failed')) {
            let result=step.result || {};
            switch (result.status) {
                case 'passed':
                    break;
                case 'failed':
                    testCaseTag.push(createFailureOrError(gherkinKeyword?"failure":"error",result.exception));
                    attr[gherkinKeyword?"failures":"errors"]+=1;
                    return false;
                case 'pending':
                case 'undefined':
                    testCaseTag.push(createFailure(result.status === 'pending' ? 'Pending' 
                            : `Undefined step. Implement with the following snippet:\n  ${gherkinKeyword.trim()}(/^${pickleStep.text}$/, function(callback) {\n      // Write code here that turns the phrase above into concrete actions\n      callback(null, 'pending');\n  });`
                    ));
                    attr.failures+=1;
                    return false;
                case 'skipped':
                    testCaseTag.push({skipped: []});
                    attr.skipped+=1;
                    return false;
                case 'ambiguous':
                    testCaseTag.push(createFailureOrError("error",result.exception));
                    attr.errors+=1;
                    return false;
                default:
                    break;
//                    testCase.push(createFailure(`Unknown status - ${step.result.status}`));
            }
        }
        return true;
      });
      testSuite.push({testcase:testCaseTag});
    
    };    

    options.eventBroadcaster.on('test-run-started', ()=>{
        this._result=[];
    });

    options.eventBroadcaster.on('test-case-finished', options.scenarioAsStep?scenarioAsStep:scenarioAsSuite);


    options.eventBroadcaster.on('test-run-finished', ()=>{
        this._result.forEach((testSuite)=>{
            testSuite.testsuite[0]._attr.time=(testSuite.testsuite[0]._attr.time/1000).toFixed(3);
        });
        this.log(xml({ testsuites: this._result }, {indent:'  ',declaration: { encoding: 'UTF-8' }}));
    });
  }
  
}

module.exports = JUnitFormatter;

