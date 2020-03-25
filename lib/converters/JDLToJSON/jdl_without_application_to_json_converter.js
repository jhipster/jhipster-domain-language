/**
 * Copyright 2013-2020 the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see http://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const logger = require('../../utils/objects/logger');
const JSONEntity = require('../../core/jhipster/json_entity');
const { getTableNameFromEntityName } = require('../../core/jhipster/entity_table_name_creator');
const FieldConverter = require('./jdl_to_json_field_converter');
const RelationshipConverter = require('./jdl_to_json_relationship_converter');
const { formatComment } = require('../../utils/format_utils');
const { formatDateForLiquibase } = require('../../utils/format_utils');
const {
  FILTER,
  NO_FLUENT_METHOD,
  READ_ONLY,
  EMBEDDED,
  SKIP_CLIENT,
  SKIP_SERVER
} = require('../../core/jhipster/unary_options');
const BinaryOptions = require('../../core/jhipster/binary_options');

const {
  Options: { ANGULAR_SUFFIX, MICROSERVICE, SEARCH, DTO }
} = BinaryOptions;
const serviceClassOptionValue = BinaryOptions.Values.service.SERVICE_CLASS;

const USER = 'user';
const AUTHORITY = 'authority';
const builtInEntities = new Set([USER, AUTHORITY]);

let entities;
let jdlObject;

module.exports = {
  convert
};

/**
 * Converts a JDLObject to ready-to-be exported JSON entities.
 * @param {Object} args - the configuration object, keys:
 * @param {JDLObject} args.jdlObject - the JDLObject to convert to JSON
 * @param {String} args.applicationName - the application's name
 * @param {String} args.databaseType - the database type
 * @param {applicationType} args.applicationType - the application's type
 * @param {Date} args.creationTimestamp - the creation timestamp, for entities
 * @returns {Map} entities that can be exported to JSON
 */
function convert(args = {}) {
  if (!args.jdlObject || !args.applicationName || !args.databaseType) {
    throw new Error("The JDL object, the application's name and its the database type are mandatory.");
  }
  init(args);
  initializeEntities(args.creationTimestamp);
  setOptions();
  setFields();
  setRelationships();
  setApplicationToEntities();
  return new Map([[args.applicationName, Object.values(entities)]]);
}

function init(args) {
  if (jdlObject) {
    resetState();
  }
  jdlObject = args.jdlObject;
  entities = {};
}

function resetState() {
  jdlObject = null;
  entities = null;
}

function initializeEntities(creationTimestamp = new Date()) {
  jdlObject.forEachEntity((jdlEntity, index) => {
    const entityName = jdlEntity.name;
    /*
     * If the user adds a 'User' entity we consider it as the already
     * created JHipster User entity and none of its fields and owner-side
     * relationships will be considered.
     */
    if (builtInEntities.has(entityName.toLowerCase())) {
      logger.warn(
        `An Entity name '${entityName}' was used: '${entityName}' is an entity created by default by JHipster.` +
          ' All relationships toward it will be kept but any attributes and relationships from it will be disregarded.'
      );
      return;
    }
    entities[entityName] = new JSONEntity({
      entityName,
      entityTableName: getTableNameFromEntityName(jdlEntity.tableName),
      changelogDate: formatDateForLiquibase({ date: new Date(creationTimestamp), increment: index + 1 }),
      javadoc: formatComment(jdlEntity.comment)
    });
  });
}

function setOptions() {
  jdlObject.forEachOption(jdlOption => {
    if (jdlOption.entityNames.size === 1 && jdlOption.entityNames.has('*')) {
      jdlOption.setEntityNames(
        jdlObject
          .getEntityNames()
          .filter(entityName => !jdlOption.excludedNames.has(entityName) && entityName.toLowerCase() !== USER)
      );
    }
    setEntityNamesOptions(jdlOption);
  });
}

function setEntityNamesOptions(jdlOption) {
  const { key, value } = getJSONOptionKeyAndValue(jdlOption);

  jdlOption.entityNames.forEach(entityName => {
    entities[entityName][key] = value;
  });
  jdlOption.entityNames.forEach(entityName => {
    if (entities[entityName].service === 'no' && [DTO, FILTER].includes(jdlOption.name)) {
      logger.info(
        `The ${jdlOption.name} option is set for ${entityName}, the '${serviceClassOptionValue}' value for the ` +
          "'service' is gonna be set for this entity if no other value has been set."
      );
      entities[entityName].service = serviceClassOptionValue;
    }
  });

  if (jdlOption.name === SEARCH) {
    preventEntitiesFromBeingSearched(jdlOption.excludedNames);
  }
}

function getJSONOptionKeyAndValue(jdlOption) {
  switch (jdlOption.name) {
    case SKIP_CLIENT:
    case SKIP_SERVER:
    case READ_ONLY:
    case EMBEDDED:
      return { key: jdlOption.name, value: true };
    case DTO:
      return { key: jdlOption.name, value: jdlOption.value };
    case MICROSERVICE:
      return { key: 'microserviceName', value: jdlOption.value };
    case NO_FLUENT_METHOD:
      return { key: 'fluentMethods', value: false };
    case ANGULAR_SUFFIX:
      return { key: 'angularJSSuffix', value: jdlOption.value };
    case SEARCH:
      return { key: 'searchEngine', value: jdlOption.value };
    case FILTER:
      return { key: 'jpaMetamodelFiltering', value: true };
    default:
      return { key: jdlOption.name, value: jdlOption.value || true };
  }
}

function preventEntitiesFromBeingSearched(entityNames) {
  entityNames.forEach(entityName => {
    entities[entityName].searchEngine = false;
  });
}

function setFields() {
  const convertedFields = FieldConverter.convert(jdlObject);
  convertedFields.forEach((entityFields, entityName) => {
    if (builtInEntities.has(entityName.toLowerCase())) {
      return;
    }
    entities[entityName].addFields(entityFields);
  });
}

function setRelationships() {
  const convertedRelationships = RelationshipConverter.convert(
    jdlObject.getRelationships(),
    jdlObject.getEntityNames()
  );
  convertedRelationships.forEach((entityRelationships, entityName) => {
    if (builtInEntities.has(entityName.toLowerCase())) {
      return;
    }
    entities[entityName].addRelationships(entityRelationships);
  });
}

function setApplicationToEntities() {
  Object.keys(entities).forEach(entityName => {
    entities[entityName].applications = '*';
  });
}