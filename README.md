# cucumber-junit-formatter
[![Build Status](https://travis-ci.com/mvtm-dn/cucumber-junit-formatter.svg?branch=master)](https://travis-ci.com/mvtm-dn/cucumber-junit-formatter)
[![Coverage Status](https://coveralls.io/repos/github/mvtm-dn/cucumber-junit-formatter/badge.png?branch=master)](https://coveralls.io/github/mvtm-dn/cucumber-junit-formatter?branch=master)

Cucumber.js formatter that produced valid junit XML file for Jenkins/GitLab CI/CD and so on.  

Based on [cucmber-pretty](https://github.com/kozhevnikov/cucumber-pretty) and [cucmber-junit](https://github.com/stjohnjohnson/cucumber-junit).
'pending' or 'undefined' steps will be reported in xml as failures.

## Installation
```
npm install --save-dev cucumber-junit-formatter
```

## Use
```
cucumber-js -f node_modules/cucumber-junit-formatter[:<output-file>]
```

### Configuration
You can configure formatter via `--format-options <JSON-OPTIONS>`:

| parameter | default value | Description |
| --- | ---- | ----------- |
| `scenarioAsStep` | `false` | If set to true means that feature is an testsuite and scenario is a step in test suite. Default value false (means that scenario is testsuite)
|`withPackage` | `false` | If set then formatter add `package` attribute to `testsuite` element. Default value `false`.
| `propertiesInTestcase` | `false` | Add `<properties...>` to `<testcase...>`. Works only with `scenarioAsStep=true`


## References

- https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#formats
- https://github.com/cucumber/cucumber-js/blob/master/docs/custom_formatters.md
- https://stackoverflow.com/questions/4922867/what-is-the-junit-xml-format-specification-that-hudson-supports
- http://help.catchsoftware.com/display/ET/JUnit+Format
- https://www.ibm.com/support/knowledgecenter/en/SSUFAU_1.0.0/com.ibm.rsar.analysis.codereview.cobol.doc/topics/cac_useresults_junit.html
