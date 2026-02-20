const fs = require('fs');
const path = require('path');

// Lire le fichier JSON des résultats de tests
const resultsPath = path.join(__dirname, '..', 'test-results.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Calculer les statistiques
const totalTests = results.numTotalTests || 0;
const passedTests = results.numPassedTests || 0;
const failedTests = results.numFailedTests || 0;
const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

// Grouper les tests par catégorie
const categories = {
  'API Routes': { passed: 0, failed: 0, total: 0 },
  'Lib & Hooks': { passed: 0, failed: 0, total: 0 },
  'Components': { passed: 0, failed: 0, total: 0 },
};

if (results.testResults) {
  results.testResults.forEach(file => {
    const filePath = file.name || '';
    let category = 'Components';
    
    if (filePath.includes('/api/')) {
      category = 'API Routes';
    } else if (filePath.includes('/lib/')) {
      category = 'Lib & Hooks';
    }

    const fileTests = file.assertionResults || [];
    fileTests.forEach(test => {
      categories[category].total++;
      if (test.status === 'passed') {
        categories[category].passed++;
      } else if (test.status === 'failed') {
        categories[category].failed++;
      }
    });
  });
}

// Créer le tableau
console.log('\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                    RÉSUMÉ DES TESTS                            ║');
console.log('╠════════════════════════════════════════════════════════════════╣');
console.log(`║  Total: ${passedTests}/${totalTests} tests passent (${successRate}%)`.padEnd(65) + '║');
console.log('╠════════════════════════════════════════════════════════════════╣');
console.log('║  Catégorie       │  Passés  │  Échoués │  Total  │  Taux      ║');
console.log('╠════════════════════════════════════════════════════════════════╣');

Object.entries(categories).forEach(([name, stats]) => {
  const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0;
  const icon = rate >= 80 ? '✓' : rate >= 60 ? '!' : '✗';
  const namePadded = name.padEnd(15);
  const passedPadded = String(stats.passed).padStart(6);
  const failedPadded = String(stats.failed).padStart(8);
  const totalPadded = String(stats.total).padStart(6);
  const ratePadded = `${rate}%`.padStart(7);
  
  console.log(`║  ${icon} ${namePadded} │ ${passedPadded} │ ${failedPadded} │ ${totalPadded} │ ${ratePadded}  ║`);
});

console.log('╚════════════════════════════════════════════════════════════════╝');

// Objectif
const target = 187; // 80% de 234
const remaining = target - passedTests;
if (passedTests >= target) {
  console.log(`\n🎉 Objectif atteint ! (${successRate}% ≥ 80%)\n`);
} else {
  console.log(`\n📊 Il reste ${remaining} tests à corriger pour atteindre 80%\n`);
}

// Supprimer le fichier JSON
fs.unlinkSync(resultsPath);
