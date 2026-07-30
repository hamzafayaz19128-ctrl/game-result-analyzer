import { runGameDiagnostics } from '../src/utils/testRunner';

const results = runGameDiagnostics();
const failures = results.filter((result) => !result.pass);

console.log(`\nDiagnostics: ${results.length - failures.length}/${results.length} passed.`);

if (failures.length > 0) {
  console.error('\nFailed diagnostics:');
  console.table(failures);
  process.exitCode = 1;
}
