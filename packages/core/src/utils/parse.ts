import { PrimitiveValue, Properties } from '@glitz/type';

export function parseDeclarationBlock(style: Properties) {
  let block = '';
  let property: keyof Properties;
  for (property in style) {
    const value = style[property];
    if (typeof value === 'object') {
      for (const fallback of value) {
        if (block) {
          block += ';';
        }
        block += parseDeclaration(property, fallback);
      }
    } else {
      if (block) {
        block += ';';
      }
      block += parseDeclaration(property, value);
    }
  }
  return block;
}

export function parseDeclaration(property: keyof Properties, value?: PrimitiveValue) {
  if (typeof value === 'string' || typeof value === 'number') {
    if (process.env.NODE_ENV !== 'production') {
      if (value === '') {
        console.warn('Style property `%s` as empty string may cause some unexpected behavior', property);
      }
      if (typeof value === 'number' && Number.isNaN(value)) {
        console.warn('Style property `%s` as NaN may cause some unexpected behavior', property);
      }
      if (typeof value === 'number' && !Number.isFinite(value)) {
        console.warn('Style property `%s` as an infinite number may cause some unexpected behavior', property);
      }
    }
    return `${hyphenateProperty(property)}:${value}`;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('Style property `%s` of type `%s` is not supported', property, typeof value);
  }

  return '';
}

const uppercaseRegex = /[A-Z]/g;
const prefixRegex = /^(ms|moz|webkit)/;
const propertyCache: { [property: string]: string } = {};

export function hyphenateProperty(property: string) {
  return property in propertyCache
    ? propertyCache[property]
    : (propertyCache[property] = property
        .replace(uppercaseRegex, '-$&')
        .replace(prefixRegex, '-$&')
        .toLowerCase());
}
