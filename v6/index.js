/** Based on json_formater from cucumber module */

const _=require('lodash');
const {GherkinDocumentParser, PickleParser,formatLocation}=require('cucumber/lib/formatter/helpers'); // eslint-disable-line sort-imports
const {Formatter}=require('cucumber');
const {Status}=require('cucumber');
const {buildStepArgumentIterator}=require('cucumber/lib/step_arguments');
const {format}=require('assertion-error-formatter');
const utils=require("../util");
const ToXML=require("./scenarios");
// const {scenarioAsStep,scenarioAsSuite}=require("./scenarios");


const {getStepLineToKeywordMap,getScenarioLineToDescriptionMap} = GherkinDocumentParser;

const {
  getScenarioDescription,
  getStepLineToPickledStepMap,
  getStepKeyword
} = PickleParser;



/** 
* Format table. 
* Check if we can replace _.map whti row.cells.map(..)
* @param {Object} dataTable
* @return {Object}
*/
const formatDataTable=dataTable=>{
   return {
     rows: dataTable.rows.map(row=>({ cells: _.map(row.cells, 'value') }))
   };
},

/** Format doc-string
* @param {Object} docString
* @return {Object} formatted string
*/
formatDocString=docString=>{
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
getTags=obj=>_.map(obj.tags, tagData=>(
    {
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
getFeatureData=(feature, uri)=>{
   return {
       description: feature.description,
       keyword: feature.keyword,
       name: feature.name,
       line: feature.location.line,
       id: utils.convertNameToId(feature.name), 
       tags: getTags(feature),
       uri
   };
},

getScenarioData=({ pickle, scenarioLineToDescriptionMap })=>{
    const description = getScenarioDescription({
        pickle,
        scenarioLineToDescriptionMap
    });
    return {
        description,
        id: `${utils.convertNameToId(pickle.name)}`,
        keyword: 'Scenario',
        line: pickle.locations[0].line,
        name: pickle.name,
        tags: getTags(pickle),
        type: 'scenario'
    };
};



class JsonFormatter extends Formatter {
    constructor(options) {
        super(options);
//        this.features2xml=options.scenarioAsStep?scenarioAsStep:scenarioAsSuite;
        options.eventBroadcaster.on('test-run-finished', ()=>this.onTestRunFinished());
        this._toXML=new ToXML(options);
    }

    /** Format step arguments
     * @param {Object} stepArgumetns
     * @return {Object}
     */
    formatStepArguments(stepArguments) {
        const iterator = buildStepArgumentIterator({
            dataTable: formatDataTable.bind(this),
            docString: formatDocString.bind(this)
        });
        return _.map(stepArguments, iterator);
    }

    /** On test run event handler */
    onTestRunFinished() {
        const groupedTestCaseAttempts = {};
        _.each(this.eventDataCollector.getTestCaseAttempts(), testCaseAttempt=>{
            if (!testCaseAttempt.result.retried) {
                const { uri } = testCaseAttempt.testCase.sourceLocation;
                if (!groupedTestCaseAttempts[uri]) {
                    groupedTestCaseAttempts[uri] = [];
                }
                groupedTestCaseAttempts[uri].push(testCaseAttempt);
            }
        });
        const features = _.map(groupedTestCaseAttempts, (group, uri)=>{
            const gherkinDocument = this.eventDataCollector.gherkinDocumentMap[uri];
            const featureData = getFeatureData(gherkinDocument.feature, uri);
            const stepLineToKeywordMap = getStepLineToKeywordMap(gherkinDocument);
            const scenarioLineToDescriptionMap = getScenarioLineToDescriptionMap(gherkinDocument);
            featureData.elements = group.map(testCaseAttempt=>{
                const {pickle} = testCaseAttempt;
                const scenarioData = getScenarioData({
                    featureId: featureData.id,
                    pickle,
                    scenarioLineToDescriptionMap
                });
                const stepLineToPickledStepMap = getStepLineToPickledStepMap(pickle);
                let isBeforeHook = true;
                scenarioData.steps = testCaseAttempt.testCase.steps.map((testStep, index)=>{
                    isBeforeHook = isBeforeHook && !testStep.sourceLocation;
                    return this.getStepData({
                        isBeforeHook,
                        stepLineToKeywordMap,
                        stepLineToPickledStepMap,
                        testStep,
                        testStepAttachments: testCaseAttempt.stepAttachments[index],
                        testStepResult: testCaseAttempt.stepResults[index]
                    });
                });
                return scenarioData;
            });
            return featureData;
         });
        this.log(this._toXML.generateXML(features));
    }



    getStepData({isBeforeHook,stepLineToKeywordMap,stepLineToPickledStepMap,testStep,testStepAttachments,testStepResult}) {
        const data = {};
        if (testStep.sourceLocation) {
            const {line} = testStep.sourceLocation;
            const pickleStep = stepLineToPickledStepMap[line];
            data.arguments = this.formatStepArguments(pickleStep.arguments);
            data.keyword = getStepKeyword({pickleStep, stepLineToKeywordMap});
            data.line = line;
            data.name = pickleStep.text;
        } else {
            data.keyword = isBeforeHook ? 'Before' : 'After';
            data.hidden = true;
        }
        if (testStep.actionLocation) {
            data.match = {location: formatLocation(testStep.actionLocation)};
        }
        data.result={failures:0,errors:0,skipped:0};
        if (testStepResult) {
            const {exception,status} = testStepResult;
            data.result = {...{status},...data.result};
            if (!_.isUndefined(testStepResult.duration)) {
                data.result.duration = testStepResult.duration;
            }
            switch(status) {
                case Status.PASSED:
                    break;
                case Status.FAILED:
                    if (testStep.sourceLocation){
                        data.result.failures+=1;
                    }
                    else {
                        data.result.errors+=1;
                    }
                    if (exception) {
                        let {name}=exception;
                        data.result.error_name = name; // eslint-disable-line camelcase
                        data.result.error_message = format(exception); // eslint-disable-line camelcase
                    }
                    break;
                case Status.PENDING:
                        data.result.failures+=1;
                        data.result.error_message = 'Pending'; // eslint-disable-line camelcase
                        data.result.error_name = 'Pending'; // eslint-disable-line camelcase
                        break;
                case Status.UNDEFINED:
                    data.result.failures+=1;
                    data.result.error_message = `Undefined step. Implement with the following snippet:\n  ${data.keyword.trim()}(/^${data.name}$/, function(callback) {\n      // Write code here that turns the phrase above into concrete actions\n      callback(null, 'pending');\n  });`; // eslint-disable-line camelcase
                    data.result.error_name = data.result.error_message.split("\n").shift(); // eslint-disable-line camelcase
                    break;
                case Status.SKIPPED:
                    data.result.skipped+=1;
                    break;
                case Status.AMBIGUOUS:
                    data.result.errors+=1;
                    if (exception) {
                        data.result.error_message = format(exception); // eslint-disable-line camelcase
                    }
                    break;

                default:
                    break;
                //
            }
        }
        if (_.size(testStepAttachments) > 0) {
            data.embeddings = testStepAttachments.map(
                attachment=>({
                    data: attachment.data,
                    mime_type: attachment.media.type // eslint-disable-line camelcase
                })
            );
        }
        return data;
    }

}

module.exports=JsonFormatter;

