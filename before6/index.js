const {Formatter} = require('cucumber');
const xml = require('xml');
const {scenarioAsStep,scenarioAsSuite}=require("./scenarios");

class JUnitFormatter extends Formatter {
  /** @param {Options} options */
  constructor(options) {
    super(options);
    this._result=[];

    options.eventBroadcaster.on('test-run-started', ()=>{
        this._result=[];
    });

    options.eventBroadcaster.on('test-case-finished', (options.scenarioAsStep?scenarioAsStep:scenarioAsSuite)(options,this._result));


    options.eventBroadcaster.on('test-run-finished', ()=>{
        this._result.forEach((testSuite)=>{
            testSuite.testsuite[0]._attr.time=(testSuite.testsuite[0]._attr.time/1000).toFixed(3);
        });
        this.log(xml({ testsuites: this._result }, {indent:'  ',declaration: { encoding: 'UTF-8' }}));
    });
  }
  
}

module.exports = JUnitFormatter;

