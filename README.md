# cucumber-junit-formatter
Cucmber.js junit xml formatter implementing event protocol. In fact this is fast and dirty hack. But I hope I do some work to improve and cleanup code. 

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
You can configure formatter via `--format-options <JSON-OPTIONS>`

`withPackage:false`. If set then formatter add `package` attribute to `testsuite` element. Default value `false`.


## References

- https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#formats
- https://github.com/cucumber/cucumber-js/blob/master/docs/custom_formatters.md
- https://stackoverflow.com/questions/4922867/what-is-the-junit-xml-format-specification-that-hudson-supports
- http://help.catchsoftware.com/display/ET/JUnit+Format
- https://www.ibm.com/support/knowledgecenter/en/SSUFAU_1.0.0/com.ibm.rsar.analysis.codereview.cobol.doc/topics/cac_useresults_junit.html
