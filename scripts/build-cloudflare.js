/**
 * Build script for Cloudflare Pages deployment
 * 
 * Creates a unified dist/ folder with:
 * - Marketing pages at root (/, /what-we-do, /become-electrician)
 * - Admin panel at /admin/
 * - CSS at /marketing.css
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const MARKETING_TEMPLATES = path.join(ROOT_DIR, 'server', 'templates', 'marketing');
const MARKETING_CSS = path.join(ROOT_DIR, 'server', 'public', 'marketing.css');
const ADMIN_PANEL_DIR = path.join(ROOT_DIR, 'admin-panel');

// Clean and create dist directory
console.log('🧹 Cleaning dist directory...');
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Build admin panel
console.log('🔨 Building admin panel...');
execSync('npm install && npm run build', {
  cwd: ADMIN_PANEL_DIR,
  stdio: 'inherit'
});

// Copy admin panel build to dist/admin/
console.log('📁 Copying admin panel to dist/admin/...');
const adminDistDir = path.join(ADMIN_PANEL_DIR, 'dist');
const adminTargetDir = path.join(DIST_DIR, 'admin');
copyDirRecursive(adminDistDir, adminTargetDir);

// Copy and transform marketing pages
console.log('📄 Processing marketing pages...');

// home.html -> index.html (root)
processMarketingPage(
  path.join(MARKETING_TEMPLATES, 'home.html'),
  path.join(DIST_DIR, 'index.html')
);

// what-we-do.html -> what-we-do.html
processMarketingPage(
  path.join(MARKETING_TEMPLATES, 'what-we-do.html'),
  path.join(DIST_DIR, 'what-we-do.html')
);

// become-electrician.html -> become-electrician.html
processMarketingPage(
  path.join(MARKETING_TEMPLATES, 'become-electrician.html'),
  path.join(DIST_DIR, 'become-electrician.html')
);

// Copy CSS
console.log('🎨 Copying CSS...');
fs.copyFileSync(MARKETING_CSS, path.join(DIST_DIR, 'marketing.css'));

// NOTE: Functions disabled for now - bcrypt doesn't work on Cloudflare Workers
// The marketing site works as static HTML, forms will need a different backend

console.log('✅ Build complete! Output in dist/');
console.log('');
console.log('Structure:');
console.log('  dist/');
console.log('  ├── index.html          (Home page)');
console.log('  ├── what-we-do.html     (What We Do page)');
console.log('  ├── become-electrician.html (Join Us page)');
console.log('  ├── marketing.css       (Styles)');
console.log('  ├── admin/              (Admin panel SPA)');
console.log('  │   ├── index.html');
console.log('  │   └── assets/');
console.log('  └── _functions/         (Cloudflare Pages Functions)');

/**
 * Process marketing HTML file - update paths for Cloudflare Pages
 */
function processMarketingPage(srcPath, destPath) {
  let content = fs.readFileSync(srcPath, 'utf-8');
  
  // Update CSS path: /marketing/styles.css -> /marketing.css
  content = content.replace(/\/marketing\/styles\.css/g, '/marketing.css');
  
  // Update navigation links: /marketing/ -> /
  content = content.replace(/href="\/marketing\/"/g, 'href="/"');
  
  // Update navigation links: /marketing/what-we-do -> /what-we-do
  content = content.replace(/href="\/marketing\/what-we-do"/g, 'href="/what-we-do"');
  
  // Update navigation links: /marketing/become-electrician -> /become-electrician
  content = content.replace(/href="\/marketing\/become-electrician"/g, 'href="/become-electrician"');
  
  // API routes stay the same (/marketing/contact, /marketing/electrician-application)
  // These are handled by Workers Functions
  
  fs.writeFileSync(destPath, content);
  console.log(`  ✓ ${path.basename(srcPath)} -> ${path.basename(destPath)}`);
}

/**
 * Recursively copy directory
 */
function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
