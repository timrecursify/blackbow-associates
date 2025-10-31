/**
 * Test script for lead ID generation
 */

import {
  generateLeadId,
  normalizeStateCode,
  validateLeadId,
  extractStateFromId,
  extractDateFromId
} from '../src/utils/leadIdGenerator.js';

console.log('========================================');
console.log('Lead ID Generation Test');
console.log('========================================\n');

// Test 1: Valid state codes
console.log('Test 1: Valid State Codes');
console.log('----------------------------');
const states = ['MD', 'NY', 'FL', 'CA', 'TX', 'DC'];
states.forEach(state => {
  const id = generateLeadId(state);
  console.log(`${state}: ${id}`);
  console.log(`  ↳ Valid: ${validateLeadId(id)}`);
  console.log(`  ↳ Extracted State: ${extractStateFromId(id)}`);
});

// Test 2: Invalid/empty states (should use XX)
console.log('\nTest 2: Invalid/Empty States (should use XX)');
console.log('----------------------------');
const invalidStates = [null, undefined, '', '131', '147', 'ABC', '1'];
invalidStates.forEach(state => {
  const id = generateLeadId(state);
  const stateStr = state === null ? 'null' : state === undefined ? 'undefined' : `"${state}"`;
  console.log(`${stateStr}: ${id}`);
  console.log(`  ↳ State Code: ${extractStateFromId(id)}`);
});

// Test 3: Validate ID format
console.log('\nTest 3: ID Format Validation');
console.log('----------------------------');
const testId = generateLeadId('MD');
console.log(`Sample ID: ${testId}`);
console.log(`  ↳ Length: ${testId.length} (expected: 19)`);
console.log(`  ↳ Valid: ${validateLeadId(testId)}`);
console.log(`  ↳ State: ${extractStateFromId(testId)}`);
console.log(`  ↳ Date: ${extractDateFromId(testId)}`);

// Test 4: Invalid IDs
console.log('\nTest 4: Invalid ID Validation');
console.log('----------------------------');
const invalidIds = [
  'TOOLONG123456789012345',
  'SHORT',
  '12MD12345678901234567',
  'MD123456789012345',
  ''
];
invalidIds.forEach(id => {
  console.log(`"${id}": Valid = ${validateLeadId(id)}`);
});

// Test 5: State normalization
console.log('\nTest 5: State Normalization');
console.log('----------------------------');
const testStates = ['md', 'Ny', 'FL', 'ca', null, '131', 'ABC'];
testStates.forEach(state => {
  const normalized = normalizeStateCode(state);
  const stateStr = state === null ? 'null' : `"${state}"`;
  console.log(`${stateStr} → ${normalized}`);
});

// Test 6: Uniqueness (generate multiple IDs quickly)
console.log('\nTest 6: Uniqueness Test (10 IDs in quick succession)');
console.log('----------------------------');
const ids = [];
for (let i = 0; i < 10; i++) {
  ids.push(generateLeadId('NY'));
}
const uniqueIds = new Set(ids);
console.log(`Generated: ${ids.length} IDs`);
console.log(`Unique: ${uniqueIds.size} IDs`);
console.log(`Duplicates: ${ids.length - uniqueIds.size}`);
if (uniqueIds.size === ids.length) {
  console.log('✓ All IDs are unique');
} else {
  console.log('✗ Duplicate IDs detected!');
  console.log('IDs:', ids);
}

console.log('\n========================================');
console.log('✅ All tests completed');
console.log('========================================\n');
