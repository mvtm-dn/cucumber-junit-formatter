import { expect } from 'chai'
import EventEmitter from 'events'
const { formatterHelpers, Status } = require('cucumber');

const TestEvents=require("./emitter");


const JUnitFormatter=require('../index.js');

describe('JUnitFormatter with scenarioAsStep=true', () => {
  beforeEach(function() {
    this.eventBroadcaster = new EventEmitter()
    this.output = ''
    const logFn = data => {
      this.output += data
    }
    this.JUnitFormatter = new JUnitFormatter({
      eventBroadcaster: this.eventBroadcaster,
      eventDataCollector: new formatterHelpers.EventDataCollector(this.eventBroadcaster),
      log: logFn,
      scenarioAsStep:true
    })
  })

  describe('no features', () => {
    beforeEach(function() {
      this.eventBroadcaster.emit('test-run-finished')
    })

    it('outputs an empty xml', function() {
      expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
      '<testsuites>\n'+
      '</testsuites>'
      )
    })
  })
  
  describe('one scenario with one step', () => {
    let testCase;
    beforeEach(function() {
      testCase=new TestEvents(this.eventBroadcaster);
      testCase.addScenario(
          '@tag1 @tag2\n' +
          'Feature: my feature\n' +
          'my feature description\n' +
          'Scenario: my scenario\n' +
          'my scenario description\n' +
          'Given my step',
          'a.feature',
          4
      );
    });

    describe('passed', () => {
      beforeEach(function() {
        testCase.prepareTestCase();
        testCase.finishTestCase({
          duration: 1, status: Status.PASSED 
        });
        testCase.finish();
      })

      it('outputs the feature', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature" tests="1" failures="0" skipped="0" errors="0" time="0.001">\n'+
          '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
        );
      })
    })
    
    describe('failed', () => {
      beforeEach(function() {
        testCase.prepareTestCase();
        testCase.finishTestCase({
          duration: 1, exception: 'my error', status: Status.FAILED 
        });
        testCase.finish();
      })

      it('includes the error message', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature" tests="1" failures="1" skipped="0" errors="0" time="0.001">\n'+
          '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
          '      <failure message="undefined">my error</failure>\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
        );
      });
    });
    
    describe('ambiguous', () => {
      beforeEach(function() {
        testCase.prepareTestCase();
        testCase.finishTestCase({
          duration: 1, 
          exception: 'Multiple step definitions match:\n' +
            '  pattern1        - steps.js:3\n' +
            '  longer pattern2 - steps.js:4',
          status: Status.AMBIGUOUS 
        });
        testCase.finish();
      });

      it('includes the error message', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature" tests="1" failures="0" skipped="0" errors="1" time="0.001">\n'+
          '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
          '      <error message="undefined">Multiple step definitions match:\n' +
          '  pattern1        - steps.js:3\n' +
          '  longer pattern2 - steps.js:4'+
          '</error>\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
        );
      });
    });
    
    
    describe('with hooks', () => {
      beforeEach(function() {
      })
      
      describe('passed',() => {
          beforeEach(function() {
            testCase.prepareTestCase(
              [
                {
                  actionLocation: { uri: 'steps.js', line: 10 },
                },
                {
                  sourceLocation: { uri: 'a.feature', line: 6 },
                  actionLocation: { uri: 'steps.js', line: 11 },
                },
                {
                  actionLocation: { uri: 'steps.js', line: 12 },
                },
              ]
            );
            testCase.finishTestCase({
              duration: 1, status: Status.PASSED
            },true);
            testCase.finish();
          })
      
        it('outputs test suties', function() {
          expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
            '<testsuites>\n'+
            '  <testsuite name="my-feature" tests="1" failures="0" skipped="0" errors="0" time="0.001">\n'+
            '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
            '    </testcase>\n'+
            '  </testsuite>\n'+
            '</testsuites>'
          );
        });
      });
      
      describe('failed',() => {
        beforeEach(function() {
          testCase.prepareTestCase(
            [
              {
                actionLocation: { uri: 'steps.js', line: 10 },
                result: { duration: 1, exception: 'my error', status: Status.FAILED },
              }
            ]
          );
          testCase.finishTestCase({
            duration: 1, 
            exception: 'my error',
            status: Status.FAILED 
          },true);
          testCase.finish();
        });
    
        it('include error messages', function() {
          expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
            '<testsuites>\n'+
            '  <testsuite name="my-feature" tests="1" failures="0" skipped="0" errors="1" time="0.001">\n'+
            '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
            '      <error message="undefined">my error</error>\n'+
            '    </testcase>\n'+
            '  </testsuite>\n'+
            '</testsuites>'
          );
        });
      });

      describe('pending',() => {
        beforeEach(function() {
          testCase.prepareTestCase(
            [
              {
                actionLocation: { uri: 'steps.js', line: 10 },
              },
              {
                sourceLocation: { uri: 'a.feature', line: 6 },
                actionLocation: { uri: 'steps.js', line: 11 },
              }
            ]
          );
          testCase.finishTestCase(
            { duration: 1, status: Status.PENDING },
            true,
            1
          );
          testCase.finish();
        });
      
        it('include error messages', function() {
          expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
            '<testsuites>\n'+
            '  <testsuite name="my-feature" tests="1" failures="1" skipped="0" errors="0" time="0.001">\n'+
            '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
            '      <failure message="Pending">Pending</failure>\n'+
            '    </testcase>\n'+
            '  </testsuite>\n'+
            '</testsuites>'
          );
        });
      });

      describe('undefined',() => {
        beforeEach(function() {
          testCase.prepareTestCase(
            [
              {
                actionLocation: { uri: 'steps.js', line: 10 },
              },
              {
                sourceLocation: { uri: 'a.feature', line: 6 },
                actionLocation: { uri: 'steps.js', line: 11 },
              }
            ]
          );
          testCase.finishTestCase(
            { duration: 1,status: Status.UNDEFINED },
            true,
            1
          );
          testCase.finish();
        })
    
        it('include error messages', function() {
          expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
            '<testsuites>\n'+
            '  <testsuite name="my-feature" tests="1" failures="1" skipped="0" errors="0" time="0.001">\n'+
            '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
            '      <failure message="Undefined step. Implement with the following snippet:">Undefined step. Implement with the following snippet:\n'+
            '  Given(/^my step$/, function(callback) {\n'+
            '      // Write code here that turns the phrase above into concrete actions\n'+
            '      callback(null, &apos;pending&apos;);\n'+
            '  });</failure>\n'+
            '    </testcase>\n'+
            '  </testsuite>\n'+
            '</testsuites>'
          );
        })
      })

      describe('skipped',() => {
        beforeEach(function() {
          testCase.prepareTestCase(
            [
              {
                actionLocation: { uri: 'steps.js', line: 10 },
              },
              {
                sourceLocation: { uri: 'a.feature', line: 6 },
                actionLocation: { uri: 'steps.js', line: 11 },
              }
            ]
          );
          testCase.finishTestCase(
            { duration: 1, status: Status.SKIPPED },
            true,
            1
          );
          testCase.finish();
        })
      
        it('include error messages', function() {
          expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
            '<testsuites>\n'+
            '  <testsuite name="my-feature" tests="1" failures="0" skipped="1" errors="0" time="0.001">\n'+
            '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
            '      <skipped>\n'+
            '      </skipped>\n'+
            '    </testcase>\n'+
            '  </testsuite>\n'+
            '</testsuites>'
          );
        })
      })
      
    })
    
  })
    
  describe('two features with one scenario with one step', () => {
    let testCase;
    beforeEach(function() {
      testCase = new TestEvents(this.eventBroadcaster);
    })

    describe('passed', () => {
      beforeEach(function() {
        testCase.addScenario('@tag1 @tag2\n' +
                'Feature: my feature\n' +
                'my feature description\n' +
                'Scenario: my scenario\n' +
                'my scenario description\n' +
                'Given my step',
              'a.feature',
              4
          );
        testCase.prepareTestCase();
        testCase.finishTestCase({ duration: 1, status: Status.PASSED });
        testCase.addScenario('@tag1 @tag2\n' +
                'Feature: my feature 1\n' +
                'my feature 1 description\n' +
                'Scenario: my scenario 1\n' +
                'my scenario 1 description\n' +
                'Given my step1',
              'b.feature',
              4
          );
          testCase.prepareTestCase(undefined,1);
          testCase.finishTestCase({ duration: 1, status: Status.PASSED },true,0,1);
          testCase.finish();
      })

      it('outputs the features', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature" tests="1" failures="0" skipped="0" errors="0" time="0.001">\n'+
          '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '  <testsuite name="my-feature-1" tests="1" failures="0" skipped="0" errors="0" time="0.001">\n'+
          '    <testcase classname="my-scenario-1" name="my scenario 1" time="0.001">\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
        );
      })
    })

  })   


});

describe('JUnitFormatter with scenarioAsStep=true, propertiesInTestcase=true', () => {
  beforeEach(function() {
    this.eventBroadcaster = new EventEmitter()
    this.output = ''
    const logFn = data => {
      this.output += data
    }
    this.JUnitFormatter = new JUnitFormatter({
      eventBroadcaster: this.eventBroadcaster,
      eventDataCollector: new formatterHelpers.EventDataCollector(this.eventBroadcaster),
      log: logFn,
      scenarioAsStep:true,
      propertiesInTestcase:true
    })
  })
  
  describe('one scenario with one step', () => {
    let testCase;
    beforeEach(function() {
      testCase = new TestEvents(this.eventBroadcaster);
      testCase.addScenario(
        '@tag1 @tag2\n' +
          'Feature: my feature\n' +
          'my feature description\n' +
          'Scenario: my scenario\n' +
          'my scenario description\n' +
          'Given my step',
        'a.feature',
        4
      );
    })

    describe('passed', () => {
      beforeEach(function() {
        testCase.prepareTestCase();
        testCase.finishTestCase({ duration: 1, status: Status.PASSED });
        testCase.finish();
      })

      it('outputs the feature', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature" tests="1" failures="0" skipped="0" errors="0" time="0.001">\n'+
          '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
          '      <properties>\n'+
          '        <property name="tag" value="@tag1">\n'+
          '        </property>\n'+
          '        <property name="tag" value="@tag2">\n'+
          '        </property>\n'+
          '      </properties>\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
        );
      })
    })
    
    describe('failed', () => {
      beforeEach(function() {
        testCase.prepareTestCase();
        testCase.finishTestCase({ duration: 1, exception: 'my error', status: Status.FAILED });
        testCase.finish();
      })

      it('includes the error message', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature" tests="1" failures="1" skipped="0" errors="0" time="0.001">\n'+
          '    <testcase classname="my-scenario" name="my scenario" time="0.001">\n'+
          '      <properties>\n'+
          '        <property name="tag" value="@tag1">\n'+
          '        </property>\n'+
          '        <property name="tag" value="@tag2">\n'+
          '        </property>\n'+
          '      </properties>\n'+
          '      <failure message="undefined">my error</failure>\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
        );
      
      
      })
    })
    
  })
  
  
})
