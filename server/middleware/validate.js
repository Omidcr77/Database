import mongoose from 'mongoose';
import { AppError } from './errors.js';

function isEmpty(val) {
  return val === undefined || val === null || (typeof val === 'string' && val.trim() === '');
}

export function validateRequest(schema, location = 'body') {
  return (req, _res, next) => {
    const payload =
      location === 'query'
        ? req.query || {}
        : location === 'params'
          ? req.params || {}
          : req.body || {};

    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = payload[field];
      const required = rules.required === true;

      if (isEmpty(value)) {
        if (required) {
          errors.push({ field, message: 'Required' });
        }
        continue;
      }

      switch (rules.type) {
        case 'string': {
          if (typeof value !== 'string') {
            errors.push({ field, message: 'Must be a string' });
            break;
          }
          if (rules.min && value.trim().length < rules.min) {
            errors.push({ field, message: `Must be at least ${rules.min} characters` });
          }
          if (rules.max && value.length > rules.max) {
            errors.push({ field, message: `Must be at most ${rules.max} characters` });
          }
          if (rules.pattern && !(new RegExp(rules.pattern).test(value))) {
            errors.push({ field, message: 'Invalid format' });
          }
          break;
        }
        case 'number': {
          const num = typeof value === 'number' ? value : Number(value);
          if (!Number.isFinite(num)) {
            errors.push({ field, message: 'Must be a number' });
            break;
          }
          if ('min' in rules && num < rules.min) {
            errors.push({ field, message: `Must be >= ${rules.min}` });
          }
          if ('max' in rules && num > rules.max) {
            errors.push({ field, message: `Must be <= ${rules.max}` });
          }
          break;
        }
        case 'boolean': {
          if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
            errors.push({ field, message: 'Must be a boolean' });
          }
          break;
        }
        case 'enum': {
          if (!rules.values?.includes(value)) {
            errors.push({ field, message: `Must be one of: ${rules.values?.join(', ')}` });
          }
          break;
        }
        case 'date': {
          const d = new Date(value);
          if (isNaN(d)) {
            errors.push({ field, message: 'Must be a valid date' });
          }
          break;
        }
        case 'objectId': {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            errors.push({ field, message: 'Must be a valid id' });
          }
          break;
        }
        default:
          break;
      }
    }

    if (errors.length) {
      return next(new AppError(400, 'Validation failed', errors));
    }

    next();
  };
}
