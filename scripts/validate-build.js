#!/usr/bin/env node

/**
 * Build validation script
 * Checks for common issues before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating build...');

// Check if .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (!fs.existsSync(nextDir)) {
  console.error('❌ Build failed: .next directory not found');
  process.exit(1);
}

// Check for build artifacts
const buildArtifacts = [
  '.next/static',
  '.next/server'
];

let missingArtifacts = [];
buildArtifacts.forEach(artifact => {
  const artifactPath = path.join(process.cwd(), artifact);
  if (!fs.existsSync(artifactPath)) {
    missingArtifacts.push(artifact);
  }
});

if (missingArtifacts.length > 0) {
  console.error('❌ Build incomplete: Missing artifacts:', missingArtifacts.join(', '));
  process.exit(1);
}

// Check for build success by looking for key files
const keyFiles = [
  '.next/build-manifest.json',
  '.next/static/chunks'
];

let missingFiles = [];
keyFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('❌ Build incomplete: Missing files:', missingFiles.join(', '));
  process.exit(1);
}

console.log('✅ Build validation passed!');
console.log('📦 Build artifacts found:', buildArtifacts.length);
console.log('🚀 Ready for deployment!');
