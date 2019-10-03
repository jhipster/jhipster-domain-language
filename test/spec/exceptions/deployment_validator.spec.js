/** Copyright 2013-2019 the original author or authors from the JHipster project.
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

const { expect } = require('chai');
const { checkDeployment } = require('../../../lib/exceptions/deployment_validator');

describe('DeploymentValidator', () => {
  describe('checkDeployment', () => {
    context('when no deployment is passed', () => {
      it('should fail', () => {
        expect(() => checkDeployment()).to.throw(/^No deployment\.$/);
      });
    });
    context('when a deployment is passed', () => {
      context('when not missing any attribute', () => {
        it('should not fail', () => {
          expect(() => {
            checkDeployment({
              deploymentType: 'kubernetes',
              appsFolders: ['invoices'],
              dockerRepositoryName: 'test'
            });
          }).not.to.throw();
        });
      });
      context('when missing attributes', () => {
        it('should fail', () => {
          expect(() => checkDeployment({})).to.throw(
            /^The deployment attributes deploymentType, appsFolders, dockerRepositoryName were not found.$/
          );
        });
      });
    });
  });
});
