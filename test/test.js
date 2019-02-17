import { expect } from 'chai'
import EventEmitter from 'events'

import Gherkin from 'gherkin'
const { Formatter, formatterHelpers, Status } = require('cucumber');

const JunitFormatter=require('../index.js');

describe('JunitFormatter', () => {
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
      '    <properites>\n'+
      '      <property name="tag" value="@tag1">\n'+
      '      </property>\n'+
      '      <property name="tag" value="@tag2">\n'+
      '      </property>\n'+
      '    </properites>\n'+
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
      '    <properites>\n'+
      '      <property name="tag" value="@tag1">\n'+
      '      </property>\n'+
      '      <property name="tag" value="@tag2">\n'+
      '      </property>\n'+
      '    </properites>\n'+
      '    <testcase classname="my-step" name="my step" time="0.001">\n'+
      '      <failure message="undefined">my error</failure>\n'+
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
          '    <properites>\n'+
          '      <property name="tag" value="@tag1">\n'+
          '      </property>\n'+
          '      <property name="tag" value="@tag2">\n'+
          '      </property>\n'+
          '    </properites>\n'+
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
          '    <properites>\n'+
          '      <property name="tag" value="@tag1">\n'+
          '      </property>\n'+
          '      <property name="tag" value="@tag2">\n'+
          '      </property>\n'+
          '    </properites>\n'+
          '    <testcase classname="my-scenario-before" name="my scenario before" time="0.001">\n'+
          '      <error message="undefined">my error</error>\n'+
          '    </testcase>\n'+
          '  </testsuite>\n'+
          '</testsuites>'
          );
          })
      })
      
    })
    
   })


});
