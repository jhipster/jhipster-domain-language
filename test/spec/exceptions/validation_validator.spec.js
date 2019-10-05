const { expect } = require('chai');
const JDLValidation = require('../../../lib/core/jdl_validation');
const ValidationValidator = require('../../../lib/exceptions/validation_validator');

describe('ValidationValidator', () => {
  let validator;

  before(() => {
    validator = new ValidationValidator();
  });

  describe('validate', () => {
    context('when not passing anything', () => {
      it('should fail', () => {
        expect(() => validator.validate()).to.throw(/^No validation\.$/);
      });
    });
    context('when passing a validation', () => {
      context('with all its required attributes', () => {
        it('should not fail', () => {
          expect(() => validator.validate({ name: 'required' })).not.to.throw();
        });
      });
      context('without any of its required attributes', () => {
        it('should fail', () => {
          expect(() => validator.validate({})).to.throw(/^The validation attribute name was not found\.$/);
        });
      });
      context('when passing an invalid name for a validation', () => {
        let validation;

        before(() => {
          validation = new JDLValidation({
            name: 'min',
            value: 0
          });
          validation.name = 'toto';
        });

        it('should fail', () => {
          expect(() => validator.validate(validation)).to.throw(/^The validation toto doesn't exist\.$/);
        });
      });
      context('when not passing a value when required', () => {
        let validation;

        before(() => {
          validation = new JDLValidation({
            name: 'min',
            value: 0
          });
          delete validation.value;
        });

        it('should fail', () => {
          expect(() => validator.validate(validation)).to.throw(/^The validation min requires a value\.$/);
        });
      });
    });
  });
});