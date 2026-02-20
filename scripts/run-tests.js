#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🧪 Lancement des tests...\n');

const vitest = spawn('vitest', ['run'], { 
  shell: true,
  stdio: 'inherit'
});

vitest.on('exit', (code) => {
  // Exécuter vitest en mode JSON pour obtenir les stats
  try {
    execSync('vitest run --reporter=json --outputFile=.test-results.json', { 
      stdio: 'pipe'
    });
  } catch (error) {
    // Ignorer les erreurs car vitest retourne 1 si des tests échouent
  }

  try {
    const resultsPath = path.join(process.cwd(), '.test-results.json');
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    const totalTests = results.numTotalTests || 0;
    const passedTests = results.numPassedTests || 0;
    const failedTests = results.numFailedTests || 0;
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    
    // Afficher le tableau récapitulatif
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    RÉSUMÉ DES TESTS                            ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    
    const emoji = successRate >= 80 ? '🎉' : successRate >= 60 ? '⚠️ ' : '❌';
    const status = successRate >= 80 ? 'EXCELLENT' : successRate >= 60 ? 'BON' : 'À AMÉLIORER';
    
    console.log(`║  ${emoji} Statut: ${status.padEnd(50)} ║`);
    console.log(`║     Total: ${passedTests}/${totalTests} tests passent`.padEnd(65) + '║');
    console.log(`║     Taux de réussite: ${successRate}%`.padEnd(65) + '║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    
    // Barre de progression
    const barLength = 50;
    const filledLength = Math.round((passedTests / totalTests) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`║  ${bar}  ║`);
    
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  ✓ Tests réussis:  ${String(passedTests).padStart(4)}`.padEnd(65) + '║');
    console.log(`║  ✗ Tests échoués:  ${String(failedTests).padStart(4)}`.padEnd(65) + '║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    
    // Objectif
    const target = Math.ceil(totalTests * 0.8); // 80%
    const remaining = target - passedTests;
    
    if (passedTests >= target) {
      console.log(`\n🎉 OBJECTIF ATTEINT ! Taux de réussite: ${successRate}% ≥ 80%\n`);
    } else {
      console.log(`\n📊 Progression: ${successRate}% / 80%`);
      console.log(`   Il reste ${remaining} tests à corriger pour atteindre l'objectif\n`);
    }
    
    // Supprimer le fichier JSON
    fs.unlinkSync(resultsPath);
  } catch (error) {
    console.error('\n⚠️  Impossible de générer le résumé détaillé\n');
  }
  
  process.exit(code);
});
