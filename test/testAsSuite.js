import { expect } from 'chai'
import EventEmitter from 'events'

import Gherkin from 'gherkin'
const { Formatter, formatterHelpers, Status } = require('cucumber');

const JunitFormatter=require('../index.js');

describe('JunitFormatter with scenarioAsStep=false', () => {
  beforeEach(function() {
    this.eventBroadcaster = new EventEmitter()
    this.output = ''
    const logFn = data => {
      this.output += data
    }
    this.junitFormatter = new JunitFormatter({
      eventBroadcaster: this.eventBroadcaster,
      eventDataCollector: new formatterHelpers.EventDataCollector(this.eventBroadcaster),
      log: logFn,
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
    beforeEach(function() {
      const events = Gherkin.generateEvents(
        '@tag1 @tag2\n' +
          'Feature: my feature\n' +
          'my feature description\n' +
          'Scenario: my scenario\n' +
          'my scenario description\n' +
          'Given my step',
        'a.feature'
      )
      events.forEach(event => {
        this.eventBroadcaster.emit(event.type, event)
        if (event.type === 'pickle') {
          this.eventBroadcaster.emit('pickle-accepted', {
            type: 'pickle-accepted',
            pickle: event.pickle,
            uri: event.uri,
          })
        }
      })
      this.testCase = { sourceLocation: { uri: 'a.feature', line: 4 } }
    })

    describe('passed', () => {
      beforeEach(function() {
        this.eventBroadcaster.emit('test-case-prepared', {
          sourceLocation: this.testCase.sourceLocation,
          steps: [
            {
              sourceLocation: { uri: 'a.feature', line: 6 },
            },
          ],
        })
        this.eventBroadcaster.emit('test-step-finished', {
          index: 0,
          testCase: this.testCase,
          result: { duration: 1, status: Status.PASSED },
        })
        this.eventBroadcaster.emit('test-case-finished', {
          sourceLocation: this.testCase.sourceLocation,
          result: { duration: 1, status: Status.PASSED },
        })
        this.eventBroadcaster.emit('test-run-finished')
      })

      it('outputs the feature', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
      '<testsuites>\n'+
      '  <testsuite name="my-feature;my-scenario" tests="1" failures="0" skipped="0" errors="0" time="0.001">\n'+
      '    <properties>\n'+
      '      <property name="tag" value="@tag1">\n'+
      '      </property>\n'+
      '      <property name="tag" value="@tag2">\n'+
      '      </property>\n'+
      '    </properties>\n'+
      '    <testcase classname="my-step" name="my step" time="0.001">\n'+
      '    </testcase>\n'+
      '  </testsuite>\n'+
      '</testsuites>'
      );
      })
    })
    
    describe('failed', () => {
      beforeEach(function() {
        this.eventBroadcaster.emit('test-case-prepared', {
          sourceLocation: this.testCase.sourceLocation,
          steps: [
            {
              sourceLocation: { uri: 'a.feature', line: 6 },
            },
          ],
        })
        this.eventBroadcaster.emit('test-step-finished', {
          index: 0,
          testCase: this.testCase,
          result: { duration: 1, exception: 'my error', status: Status.FAILED },
        })
        this.eventBroadcaster.emit('test-case-finished', {
          sourceLocation: this.testCase.sourceLocation,
          result: { duration: 1, status: Status.FAILED },
        })
        this.eventBroadcaster.emit('test-run-finished')
      })

      it('includes the error message', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
      '<testsuites>\n'+
      '  <testsuite name="my-feature;my-scenario" tests="1" failures="1" skipped="0" errors="0" time="0.001">\n'+
      '    <properties>\n'+
      '      <property name="tag" value="@tag1">\n'+
      '      </property>\n'+
      '      <property name="tag" value="@tag2">\n'+
      '      </property>\n'+
      '    </properties>\n'+
      '    <testcase classname="my-step" name="my step" time="0.001">\n'+
      '      <failure message="undefined">my error</failure>\n'+
      '    </testcase>\n'+
      '  </testsuite>\n'+
      '</testsuites>'
      );
      
      
      })
    })
    
    describe('ambiguous', () => {
      beforeEach(function() {
        this.eventBroadcaster.emit('test-case-prepared', {
          sourceLocation: this.testCase.sourceLocation,
          steps: [
            {
              sourceLocation: { uri: 'a.feature', line: 6 },
            },
          ],
        })
        this.eventBroadcaster.emit('test-step-finished', {
          index: 0,
          testCase: this.testCase,
          result: {
              duration: 1, 
              exception: 'Multiple step definitions match:\n' +
                '  pattern1        - steps.js:3\n' +
                '  longer pattern2 - steps.js:4',
               status: Status.AMBIGUOUS 
           },
        })
        this.eventBroadcaster.emit('test-case-finished', {
          sourceLocation: this.testCase.sourceLocation,
          result: { duration: 1, status: Status.AMBIGUOUS },
        })
        this.eventBroadcaster.emit('test-run-finished')
      })

      it('includes the error message', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
      '<testsuites>\n'+
      '  <testsuite name="my-feature;my-scenario" tests="1" failures="0" skipped="0" errors="1" time="0.001">\n'+
      '    <properties>\n'+
      '      <property name="tag" value="@tag1">\n'+
      '      </property>\n'+
      '      <property name="tag" value="@tag2">\n'+
      '      </property>\n'+
      '    </properties>\n'+
      '    <testcase classname="my-step" name="my step" time="0.001">\n'+
      '      <error message="undefined">Multiple step definitions match:\n' +
      '  pattern1        - steps.js:3\n' +
      '  longer pattern2 - steps.js:4'+
      '</error>\n'+
      '    </testcase>\n'+
      '  </testsuite>\n'+
      '</testsuites>'
      );
      
      
      })
    })
    
    
    describe('with hooks', () => {
      beforeEach(function() {
      })
      
      describe('passed',() => {
          beforeEach(function() {
            this.eventBroadcaster.emit('test-case-prepared', {
              sourceLocation: this.testCase.sourceLocation,
              steps: [
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
              ],
            })
            this.eventBroadcaster.emit('test-case-finished', {
              sourceLocation: this.testCase.sourceLocation,
              result: { duration: 1, status: Status.PASSED },
            })
            this.eventBroadcaster.emit('test-run-finished')
          })
      
          it('outputs test suties', function() {
            expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature;my-scenario" tests="1" failures="0" skipped="0" errors="0" time="0.001">\n'+
          '    <properties>\n'+
          '      <property name="tag" value="@tag1">\n'+
          '      </property>\n'+
          '      <property name="tag" value="@tag2">\n'+
          '      </property>\n'+
          '    </properties>\n'+
          '    <testcase classname="my-step" name="my step" time="0.000">\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
          );
          })
      })
      
      describe('failed',() => {
          beforeEach(function() {
            this.eventBroadcaster.emit('test-case-prepared', {
              sourceLocation: this.testCase.sourceLocation,
              steps: [
                {
                  actionLocation: { uri: 'steps.js', line: 10 },
                  result: { duration: 1, exception: 'my error', status: Status.FAILED },
                },
              ],
            })

            this.eventBroadcaster.emit('test-case-finished', {
              sourceLocation: this.testCase.sourceLocation,
              result: { duration: 1, status: Status.FAILED },
            })
            this.eventBroadcaster.emit('test-run-finished')
          })
      
          it('include error messages', function() {
            expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature;my-scenario" tests="1" failures="0" skipped="0" errors="1" time="0.001">\n'+
          '    <properties>\n'+
          '      <property name="tag" value="@tag1">\n'+
          '      </property>\n'+
          '      <property name="tag" value="@tag2">\n'+
          '      </property>\n'+
          '    </properties>\n'+
          '    <testcase classname="my-scenario-before" name="my scenario before" time="0.001">\n'+
          '      <error message="undefined">my error</error>\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
          );
          })
      })
      
      describe('failed after',() => {
          beforeEach(function() {
            this.eventBroadcaster.emit('test-case-prepared', {
              sourceLocation: this.testCase.sourceLocation,
              steps: [
                {
                  actionLocation: { uri: 'steps.js', line: 10 },
                },
                {
                  sourceLocation: { uri: 'a.feature', line: 6 },
                  actionLocation: { uri: 'steps.js', line: 11 },
                },
                {
                  actionLocation: { uri: 'steps.js', line: 12 },
                  result: { duration: 1, exception: 'my error', status: Status.FAILED },
                },
              ],
            })

            this.eventBroadcaster.emit('test-case-finished', {
              index:2,
              sourceLocation: this.testCase.sourceLocation,
              result: { duration: 1, status: Status.FAILED },
            })
            this.eventBroadcaster.emit('test-run-finished')
          })
      
          it('include error messages', function() {
            expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature;my-scenario" tests="2" failures="0" skipped="0" errors="1" time="0.001">\n'+
          '    <properties>\n'+
          '      <property name="tag" value="@tag1">\n'+
          '      </property>\n'+
          '      <property name="tag" value="@tag2">\n'+
          '      </property>\n'+
          '    </properties>\n'+
          '    <testcase classname="my-step" name="my step" time="0.000">\n'+
          '    </testcase>\n'+
          '    <testcase classname="my-scenario-after" name="my scenario after" time="0.001">\n'+
          '      <error message="undefined">my error</error>\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
          );
          })
      })
      
      
      describe('pending',() => {
          beforeEach(function() {
            this.eventBroadcaster.emit('test-case-prepared', {
              sourceLocation: this.testCase.sourceLocation,
              steps: [
                {
                  actionLocation: { uri: 'steps.js', line: 10 },
                },
                {
                  sourceLocation: { uri: 'a.feature', line: 6 },
                  actionLocation: { uri: 'steps.js', line: 11 },
                }
              ],
            })
           this.eventBroadcaster.emit('test-step-finished', {
              index: 1,
              testCase: this.testCase,
              result: { status: Status.PENDING },
            })            
            this.eventBroadcaster.emit('test-case-finished', {
              sourceLocation: this.testCase.sourceLocation,
              result: { duration: 1, status: Status.PENDING },
            })

            this.eventBroadcaster.emit('test-run-finished')
          })
      
          it('include error messages', function() {
            expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature;my-scenario" tests="1" failures="1" skipped="0" errors="0" time="0.001">\n'+
          '    <properties>\n'+
          '      <property name="tag" value="@tag1">\n'+
          '      </property>\n'+
          '      <property name="tag" value="@tag2">\n'+
          '      </property>\n'+
          '    </properties>\n'+
          '    <testcase classname="my-step" name="my step" time="0.000">\n'+
          '      <failure message="Pending">Pending</failure>\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
          );
          })
      })

      describe('undefined',() => {
          beforeEach(function() {
            this.eventBroadcaster.emit('test-case-prepared', {
              sourceLocation: this.testCase.sourceLocation,
              steps: [
                {
                  actionLocation: { uri: 'steps.js', line: 10 },
                },
                {
                  sourceLocation: { uri: 'a.feature', line: 6 },
                  actionLocation: { uri: 'steps.js', line: 11 },
                }
              ],
            })
           this.eventBroadcaster.emit('test-step-finished', {
              index: 1,
              testCase: this.testCase,
              result: { status: Status.UNDEFINED },
            })            
            this.eventBroadcaster.emit('test-case-finished', {
              sourceLocation: this.testCase.sourceLocation,
              result: { duration: 1, status: Status.UNDEFINED },
            })

            this.eventBroadcaster.emit('test-run-finished')
          })
      
          it('include error messages', function() {
            expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature;my-scenario" tests="1" failures="1" skipped="0" errors="0" time="0.001">\n'+
          '    <properties>\n'+
          '      <property name="tag" value="@tag1">\n'+
          '      </property>\n'+
          '      <property name="tag" value="@tag2">\n'+
          '      </property>\n'+
          '    </properties>\n'+
          '    <testcase classname="my-step" name="my step" time="0.000">\n'+
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
            this.eventBroadcaster.emit('test-case-prepared', {
              sourceLocation: this.testCase.sourceLocation,
              steps: [
                {
                  actionLocation: { uri: 'steps.js', line: 10 },
                },
                {
                  sourceLocation: { uri: 'a.feature', line: 6 },
                  actionLocation: { uri: 'steps.js', line: 11 },
                }
              ],
            })
           this.eventBroadcaster.emit('test-step-finished', {
              index: 1,
              testCase: this.testCase,
              result: { status: Status.SKIPPED },
            })            
            this.eventBroadcaster.emit('test-case-finished', {
              sourceLocation: this.testCase.sourceLocation,
              result: { duration: 1, status: Status.SKIPPED },
            })

            this.eventBroadcaster.emit('test-run-finished')
          })
      
          it('include error messages', function() {
            expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
          '<testsuites>\n'+
          '  <testsuite name="my-feature;my-scenario" tests="1" failures="0" skipped="1" errors="0" time="0.001">\n'+
          '    <properties>\n'+
          '      <property name="tag" value="@tag1">\n'+
          '      </property>\n'+
          '      <property name="tag" value="@tag2">\n'+
          '      </property>\n'+
          '    </properties>\n'+
          '    <testcase classname="my-step" name="my step" time="0.000">\n'+
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
    beforeEach(function() {
      this.testCase = [];
      this.pickleEvent = (list,name,line)=>{
          let events = Gherkin.generateEvents(list,name);
          events.forEach(event => {
            this.eventBroadcaster.emit(event.type, event)
            if (event.type === 'pickle') {
              this.eventBroadcaster.emit('pickle-accepted', {
                type: 'pickle-accepted',
                pickle: event.pickle,
                uri: event.uri,
              })
            }
          })
          this.testCase.push({ sourceLocation: { uri: name, line: line } });
      };

    })

    describe('passed', () => {
      beforeEach(function() {
      this.pickleEvent('@tag1 @tag2\n' +
              'Feature: my feature\n' +
              'my feature description\n' +
              'Scenario: my scenario\n' +
              'my scenario description\n' +
              'Given my step',
            'a.feature',
            4
        );
        this.eventBroadcaster.emit('test-case-prepared', {
          sourceLocation: this.testCase[0].sourceLocation,
          steps: [
            {
              sourceLocation: { uri: 'a.feature', line: 6 },
            },
          ],
        })
        this.eventBroadcaster.emit('test-step-finished', {
          index: 0,
          testCase: this.testCase[0],
          result: { duration: 1, status: Status.PASSED },
        })
        this.eventBroadcaster.emit('test-case-finished', {
          sourceLocation: this.testCase[0].sourceLocation,
          result: { duration: 1, status: Status.PASSED },
        })
      this.pickleEvent('@tag1 @tag2\n' +
              'Feature: my feature 1\n' +
              'my feature 1 description\n' +
              'Scenario: my scenario 1\n' +
              'my scenario 1 description\n' +
              'Given my step 1',
            'b.feature',
            4
        );
        this.eventBroadcaster.emit('test-case-prepared', {
          sourceLocation: this.testCase[1].sourceLocation,
          steps: [
            {
              sourceLocation: { uri: 'b.feature', line: 6 },
            },
          ],
        })
        this.eventBroadcaster.emit('test-step-finished', {
          index: 0,
          testCase: this.testCase[1],
          result: { duration: 1, status: Status.PASSED },
        })
        this.eventBroadcaster.emit('test-case-finished', {
          sourceLocation: this.testCase[1].sourceLocation,
          result: { duration: 1, status: Status.PASSED },
        })
        this.eventBroadcaster.emit('test-run-finished')
      })

      it('outputs the features', function() {
        expect(this.output).to.equal('<?xml version="1.0" encoding="UTF-8"?>\n'+
      '<testsuites>\n'+
      '  <testsuite name="my-feature;my-scenario" tests="1" failures="0" skipped="0" errors="0" time="0.001">\n'+
      '    <properties>\n'+
      '      <property name="tag" value="@tag1">\n'+
      '      </property>\n'+
      '      <property name="tag" value="@tag2">\n'+
      '      </property>\n'+
      '    </properties>\n'+
      '    <testcase classname="my-step" name="my step" time="0.001">\n'+
      '    </testcase>\n'+
      '  </testsuite>\n'+
      '  <testsuite name="my-feature-1;my-scenario-1" tests="1" failures="0" skipped="0" errors="0" time="0.001">\n'+
      '    <properties>\n'+
      '      <property name="tag" value="@tag1">\n'+
      '      </property>\n'+
      '      <property name="tag" value="@tag2">\n'+
      '      </property>\n'+
      '    </properties>\n'+
      '    <testcase classname="my-step-1" name="my step 1" time="0.001">\n'+
      '    </testcase>\n'+
      '  </testsuite>\n'+
      '</testsuites>'
      );
      })
    })

    })   


});
