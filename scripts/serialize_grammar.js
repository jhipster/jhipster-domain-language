/**
 * Run this file to generate serialized grammar to be rendered as diagrams
 * It will serialize to ../gen/generated_serialized_grammar.js
 * The diagrams can be viewed in ../diagrams.html
 */
const path = require('path');
const fs = require('fs');

const JDLParser = require('../lib/dsl/parser').JDLParser;

const serializedGrammarText = JSON.stringify(new JDLParser().getSerializedGastProductions(), null, '\t');

// generated a JavaScript file which exports the serialized grammar on the global scope (Window)
fs.writeFileSync(
  path.join(
    __dirname,
    '../lib/dsl/gen/generated_serialized_grammar.js'
  ),
  `/* eslint-disable no-unused-vars */
const serializedGrammar = ${serializedGrammarText}`
);

