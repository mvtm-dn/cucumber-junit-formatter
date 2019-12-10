const Gherkin=require('gherkin');
const { version } = require('cucumber/package.json');
const before6=Number(version.split('.')[0])<6;

function TestEvents(emitter){
    this.emitter=emitter;
    this.testCases=[];
    this.before6=before6;
};


TestEvents.prototype.addScenario=function(scenario,feature,lineStart,lineEnd) {
    this._events=Gherkin.generateEvents(
        scenario,
        feature
    );
    this._events.forEach(event=>{
        this.emitter.emit(event.type,event);
        if (event.type === 'pickle') {
            this.emitter.emit('pickle-accepted', {
                type: 'pickle-accepted',
                pickle: event.pickle,
                uri: event.uri,
            });
        }
    });
    this.testCases.push({
        feature:feature,
        lineStart:lineStart,
        lineEnd:lineEnd || scenario.split("\n").length,
        testCase:{
            attemptNumber:1,
            sourceLocation:{
                uri:feature,
                line:lineStart
            }
        }
    })
};


TestEvents.prototype.prepareTestCase=function(steps,testCaseNo=0) {
    steps=steps || [
        {
            sourceLocation: {
                uri: this.testCases[testCaseNo].feature,
                line: this.testCases[testCaseNo].lineEnd
            }
        }
    ];
    this.emitter.emit('test-case-prepared',{
        sourceLocation: this.testCases[testCaseNo].testCase.sourceLocation,
        steps:steps
    });
    if (!before6) {
        this.emitter.emit('test-case-started',this.testCases[testCaseNo].testCase);
    }
};

TestEvents.prototype.finishTestCase=function(result,step=true,index=0,testCaseNo=0) {
    if (step) {
        this.emitter.emit('test-step-finished',{
            index: index,
            testCase: this.testCases[testCaseNo].testCase,
            result:result
        });
    }
    if (before6){
        this.emitter.emit('test-case-finished', {
          sourceLocation: this.testCases[testCaseNo].testCase.sourceLocation,
          result: result,
        });
    }
    else {
        this.emitter.emit('test-case-finished', {
          ...this.testCases[testCaseNo].testCase,
          result: result,
        });
    }
};

TestEvents.prototype.finish=function() {
    this.emitter.emit('test-run-finished');
};


module.exports=TestEvents;