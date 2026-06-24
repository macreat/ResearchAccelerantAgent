/**
 * LaTeX to PDF Conversion Service
 * Handles compilation of LaTeX files to PDF using pdflatex CLI
 * with dedicated output folder management.
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ============================================================================
// Types
// ============================================================================
export interface PDFConversionResult {
  success: boolean;
  texFilePath: string;
  pdfFilePath?: string;
  message: string;
  compilationTime?: number;
  fileSize?: number;
  error?: string;
  // Path to detailed pdflatex log (stdout + stderr)
  logPath?: string;
  // Short snippet of log to include in API error responses
  logSnippet?: string;
  // Any missing .sty files detected in the pdflatex output
  missingPackages?: string[];
  // Suggested OS/package manager packages to install (e.g., texlive-*)
  suggestedPackages?: string[];
}

export interface PDFOutputConfig {
  outputDir: string;
  tempDir: string;
  cleanupTemp: boolean;
  maxCompilationAttempts: number;
}

// ============================================================================
// Configuration
// ============================================================================
export function getDefaultPDFConfig(): PDFOutputConfig {
  return {
    outputDir: process.env.PDF_OUTPUT_DIR || "./output/SAVED_PDFS",
    tempDir: process.env.LATEX_TEMP_DIR || "./output/latex-temp",
    cleanupTemp: process.env.CLEANUP_TEMP !== "false",
    maxCompilationAttempts: 3,
  };
}

// ============================================================================
// Directory Management
// ============================================================================
export function ensureOutputDirectories(config: PDFOutputConfig): boolean {
  try {
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
      console.log(`Created PDF output directory: ${config.outputDir}`);
    }

    if (!fs.existsSync(config.tempDir)) {
      fs.mkdirSync(config.tempDir, { recursive: true });
      console.log(`Created LaTeX temp directory: ${config.tempDir}`);
    }

    // Verify write permissions
    fs.accessSync(config.outputDir, fs.constants.W_OK);
    fs.accessSync(config.tempDir, fs.constants.W_OK);

    return true;
  } catch (error) {
    console.error("Failed to ensure output directories:", error);
    return false;
  }
}

// ============================================================================
// LaTeX Compilation
// ============================================================================
export async function compileLaTeXToPDF(
  texFilePath: string,
  outputFileName?: string,
  config?: PDFOutputConfig
): Promise<PDFConversionResult> {
  const finalConfig = config || getDefaultPDFConfig();

  // Verify output directories
  if (!ensureOutputDirectories(finalConfig)) {
    return {
      success: false,
      texFilePath,
      message: "Failed to prepare output directories",
      error: "Directory creation failed",
    };
  }

  // Verify input file exists
  if (!fs.existsSync(texFilePath)) {
    return {
      success: false,
      texFilePath,
      message: `LaTeX file not found: ${texFilePath}`,
      error: "File not found",
    };
  }

  const texFileName = path.basename(texFilePath, ".tex");
  const pdfFileName = outputFileName || `${texFileName}.pdf`;
  const pdfOutputPath = path.join(finalConfig.outputDir, pdfFileName);

  const startTime = Date.now();
  let lastError: string | undefined;
  let lastMissing: string[] = [];
  let lastSuggested: string[] = [];

  // If pdflatex is not available, try a transient Docker-based compilation first
  const pdflatexAvailable = checkPdfLatexAvailable();
  if (!pdflatexAvailable) {
    console.warn("pdflatex not found on PATH — attempting transient Docker fallback");
    try {
      const dockerResult = dockerFallbackCompile(texFilePath, finalConfig);
      if (dockerResult.success) {
        const compilationTime = Date.now() - startTime;
        const tempPdfPath = path.join(path.dirname(texFilePath), `${texFileName}.pdf`);
        if (fs.existsSync(tempPdfPath)) {
          fs.copyFileSync(tempPdfPath, pdfOutputPath);
          fs.unlinkSync(tempPdfPath);

          const stats = fs.statSync(pdfOutputPath);
          if (finalConfig.cleanupTemp) {
            cleanupLatexTempFiles(path.dirname(texFilePath), texFileName);
          }

          return {
            success: true,
            texFilePath,
            pdfFilePath: pdfOutputPath,
            message: `PDF generated successfully (docker fallback): ${pdfFileName}`,
            compilationTime,
            fileSize: stats.size,
          };
        }
      } else {
        lastError = dockerResult.error;
        lastMissing = dockerResult.missingPackages || [];
        lastSuggested = dockerResult.suggestedPackages || [];
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }

    return {
      success: false,
      texFilePath,
      message: "pdflatex not found and Docker fallback failed",
      error: lastError || "pdflatex not available",
      missingPackages: lastMissing,
      suggestedPackages: lastSuggested,
    };
  }

  // Attempt compilation with retries (local pdflatex)
  for (let attempt = 1; attempt <= finalConfig.maxCompilationAttempts; attempt++) {
    try {
      console.log(`Compilation attempt ${attempt}/${finalConfig.maxCompilationAttempts} for ${texFileName}`);

      const result = compileLaTeXSync(texFilePath, finalConfig);

      if (result.success) {
        const compilationTime = Date.now() - startTime;

        // Move PDF to final output directory
        const tempPdfPath = path.join(path.dirname(texFilePath), `${texFileName}.pdf`);
        if (fs.existsSync(tempPdfPath)) {
          fs.copyFileSync(tempPdfPath, pdfOutputPath);
          fs.unlinkSync(tempPdfPath);

          const stats = fs.statSync(pdfOutputPath);

          // Cleanup temporary files if configured
          if (finalConfig.cleanupTemp) {
            cleanupLatexTempFiles(path.dirname(texFilePath), texFileName);
          }

          return {
            success: true,
            texFilePath,
            pdfFilePath: pdfOutputPath,
            message: `PDF generated successfully: ${pdfFileName}`,
            compilationTime,
            fileSize: stats.size,
          };
        }
      }

      lastError = result.error;
      lastMissing = result.missingPackages || [];
      lastSuggested = result.suggestedPackages || [];

      // If missing packages are the cause, try a simplified fallback template once
      if (lastMissing && lastMissing.length > 0) {
        try {
          const simpleTex = generateSimplifiedTex(texFilePath);
          console.log(`Attempting simplified template compile: ${simpleTex}`);
          const simpleResult = compileLaTeXSync(simpleTex, finalConfig);
          if (simpleResult.success) {
            // Move PDF from simple compile
            const simplePdf = path.join(path.dirname(simpleTex), path.basename(simpleTex).replace('.tex', '.pdf'));
            if (fs.existsSync(simplePdf)) {
              fs.copyFileSync(simplePdf, pdfOutputPath);
              fs.unlinkSync(simplePdf);
              const stats = fs.statSync(pdfOutputPath);
              if (finalConfig.cleanupTemp) cleanupLatexTempFiles(path.dirname(simpleTex), path.basename(simpleTex, '.tex'));
              return {
                success: true,
                texFilePath: simpleTex,
                pdfFilePath: pdfOutputPath,
                message: `PDF generated successfully using simplified template: ${pdfFileName}`,
                compilationTime: Date.now() - startTime,
                fileSize: stats.size,
              };
            }
          }
        } catch (e) {
          console.warn('Simplified template compile failed:', e);
        }
      }

      // Detect undefined LaTeX environments from last log and attempt to inject basic definitions
      try {
        const logPath = result.logPath || result.logPath === '' ? result.logPath : undefined;
        let logContent = '';
        if (!logPath) {
          // Try to read the pdflatex log produced earlier based on texFilePath
          const fallbackLog = path.join(path.dirname(texFilePath), path.basename(texFilePath).replace('.tex', '.pdflatex.log'));
          if (fs.existsSync(fallbackLog)) logContent = fs.readFileSync(fallbackLog, 'utf-8');
        } else if (fs.existsSync(logPath)) {
          logContent = fs.readFileSync(logPath, 'utf-8');
        }

        const undefinedEnvs = parseUndefinedEnvironmentsFromLog(logContent);
        if (undefinedEnvs && undefinedEnvs.length > 0) {
          console.log('Found undefined environments in LaTeX log:', undefinedEnvs);
          const patched = generateTexWithEnvDefinitions(texFilePath, undefinedEnvs);
          console.log('Attempting compile with injected environment definitions:', patched);
          const patchedResult = compileLaTeXSync(patched, finalConfig);
          if (patchedResult.success) {
            const patchedPdf = path.join(path.dirname(patched), path.basename(patched).replace('.tex', '.pdf'));
            if (fs.existsSync(patchedPdf)) {
              fs.copyFileSync(patchedPdf, pdfOutputPath);
              fs.unlinkSync(patchedPdf);
              const stats = fs.statSync(pdfOutputPath);
              if (finalConfig.cleanupTemp) cleanupLatexTempFiles(path.dirname(patched), path.basename(patched, '.tex'));
              return {
                success: true,
                texFilePath: patched,
                pdfFilePath: pdfOutputPath,
                message: `PDF generated successfully after injecting missing environment definitions: ${pdfFileName}`,
                compilationTime: Date.now() - startTime,
                fileSize: stats.size,
              };
            }
          }
        }
      } catch (e) {
        console.warn('Environment-injection fallback failed:', e);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      lastError = message;
      console.warn(`Compilation attempt ${attempt} failed: ${message}`);
    }
  }

  return {
    success: false,
    texFilePath,
    message: `Failed to compile LaTeX after ${finalConfig.maxCompilationAttempts} attempts`,
    error: lastError || "Unknown error",
    missingPackages: lastMissing,
    suggestedPackages: lastSuggested,
  };
}

// ============================================================================
// Synchronous LaTeX Compilation (using execSync)
// ============================================================================
import { spawnSync } from "child_process";

function parseMissingPackagesFromLog(logContent: string): string[] {
  const missing: Set<string> = new Set();
  // Look for patterns like "LaTeX Error: File `foo.sty' not found." or "! LaTeX Error: File `foo.sty' not found."
  const regex = /File `([^`']+\.sty)' not found|File `([^`']+\.sty)\' not found|\\\.sty\s+not found/g;
  let m: RegExpExecArray | null;
  // Simpler fallback regex to capture foo.sty
  const simple = /([A-Za-z0-9_\-]+)\.sty/g;

  // First search for explicit not found messages
  const notFoundRegex = /File `([^`']+\.sty)' not found|File `([^`']+\.sty)\' not found|! LaTeX Error: File `([^`']+\.sty)' not found/g;
  while ((m = notFoundRegex.exec(logContent)) !== null) {
    const name = m[1] || m[2] || m[3];
    if (name) missing.add(name.replace(/^\s+|\s+$/g, ""));
  }

  // If none found via explicit pattern, try the simple capture of .sty mentions
  if (missing.size === 0) {
    while ((m = simple.exec(logContent)) !== null) {
      const name = m[1];
      if (name && !name.endsWith('.')) missing.add(name + '.sty');
    }
  }

  return Array.from(missing);
}

function suggestTexlivePackagesForStyNames(styNames: string[]): string[] {
  const suggestions: Set<string> = new Set();
  const mapping: Record<string, string> = {
    'tikz.sty': 'texlive-pictures',
    'pgfplots.sty': 'texlive-pictures',
    'tcolorbox.sty': 'texlive-latex-recommended',
    'xcolor.sty': 'texlive-latex-recommended',
    'hyperref.sty': 'texlive-latex-recommended',
    'geometry.sty': 'texlive-latex-recommended',
    'amsmath.sty': 'texlive-latex-recommended',
    'amssymb.sty': 'texlive-latex-recommended',
    'listings.sty': 'texlive-latex-extra',
    'minted.sty': 'texlive-latex-extra',
    'fontspec.sty': 'texlive-xetex',
    'xeCJK.sty': 'texlive-xetex',
    'longtable.sty': 'texlive-latex-recommended',
    'booktabs.sty': 'texlive-latex-recommended',
    'array.sty': 'texlive-latex-recommended',
    'tabularx.sty': 'texlive-latex-recommended',
    'float.sty': 'texlive-latex-recommended',
    'enumitem.sty': 'texlive-latex-recommended',
    'fancyhdr.sty': 'texlive-latex-recommended',
    'titlesec.sty': 'texlive-latex-recommended',
    'tocloft.sty': 'texlive-latex-recommended',
    'setspace.sty': 'texlive-latex-recommended',
    'microtype.sty': 'texlive-latex-recommended',
    'wrapfig.sty': 'texlive-latex-extra',
    'babel.sty': 'texlive-latex-recommended',
    'inputenc.sty': 'texlive-latex-base',
    'fontenc.sty': 'texlive-latex-base',
    'graphicx.sty': 'texlive-latex-recommended',
  };

  for (const s of styNames) {
    const key = s.toLowerCase();
    if (mapping[key]) suggestions.add(mapping[key]);
    else suggestions.add('texlive-latex-recommended');
  }

  return Array.from(suggestions);
}

function checkCommandAvailable(cmd: string): boolean {
  try {
    const version = execSync(`${cmd} --version`, { encoding: 'utf-8', stdio: ['pipe','pipe','pipe'] });
    return !!version;
  } catch {
    return false;
  }
}

function compileLaTeXSync(
  texFilePath: string,
  _config: PDFOutputConfig
): { success: boolean; error?: string; logPath?: string; logSnippet?: string; missingPackages?: string[]; suggestedPackages?: string[] } {
  try {
    const texDir = path.dirname(texFilePath);
    const texFileName = path.basename(texFilePath);

    // Helper to write log and return structured response
    const writeLogAndReturn = (logName: string, combined: string, errMsg?: string) => {
      const logPath = path.join(texDir, logName);
      try { fs.writeFileSync(logPath, combined, 'utf-8'); } catch (e) { console.warn('Failed to write log file:', e); }
      const snippet = combined.slice(0, 2000);
      const missing = parseMissingPackagesFromLog(combined);
      const suggested = missing.length > 0 ? suggestTexlivePackagesForStyNames(missing) : [];
      return { success: false, error: errMsg || 'Compilation failed', logPath, logSnippet: snippet, missingPackages: missing, suggestedPackages: suggested };
    };

    // Prefer latexmk if available (handles multiple passes)
    if (checkCommandAvailable('latexmk')) {
      const lmCmd = ['-pdf', '-silent', `-outdir=${texDir}`, texFileName];
      const lmResult = spawnSync('latexmk', lmCmd, { cwd: texDir, encoding: 'utf-8', timeout: 120000 });
      const stdout = lmResult.stdout || '';
      const stderr = lmResult.stderr || '';
      const combined = ['--- LATEXMK STDOUT ---', stdout, '--- LATEXMK STDERR ---', stderr].join('\n');
      const logName = `${texFileName}.latexmk.log`;
      if (fs.existsSync(path.join(texDir, texFileName.replace('.tex', '.pdf')))) {
        return { success: true };
      }
      // return structured failure from latexmk
      return writeLogAndReturn(logName, combined, lmResult.error?.message || stderr || 'latexmk failed');
    }

    // Fallback: run pdflatex twice to resolve references
    // Do NOT use -halt-on-error: pdflatex should continue past non-fatal errors
    // and still produce a .pdf file in most cases
    const runs = 2;
    let combinedAll = '';
    let anyPassSucceeded = false;
    for (let i = 0; i < runs; i++) {
      const spawnResult = spawnSync('pdflatex', ['-interaction=nonstopmode', `-output-directory=${texDir}`, texFileName], { cwd: texDir, encoding: 'utf-8', timeout: 120000 });
      const stdout = spawnResult.stdout || '';
      const stderr = spawnResult.stderr || '';
      combinedAll += [`--- RUN ${i+1} STDOUT ---`, stdout, `--- RUN ${i+1} STDERR ---`, stderr].join('\n') + '\n';

      // Check if this pass produced a PDF (even with warnings/errors)
      const passPdfPath = path.join(texDir, texFileName.replace('.tex', '.pdf'));
      if (fs.existsSync(passPdfPath) && fs.statSync(passPdfPath).size > 0) {
        anyPassSucceeded = true;
      }
    }

    const logFileName = `${texFileName}.pdflatex.log`;
    const logPath = path.join(texDir, logFileName);
    try { fs.writeFileSync(logPath, combinedAll, 'utf-8'); } catch (e) { console.warn('Failed to write pdflatex log file:', e); }

    const pdfPath = path.join(texDir, texFileName.replace('.tex', '.pdf'));
    if (anyPassSucceeded && fs.existsSync(pdfPath)) {
      return { success: true };
    }

    // Parse and return structured failure info
    return writeLogAndReturn(logFileName, combinedAll, 'pdflatex failed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Compilation failed';
    return { success: false, error: message };
  }
}

function generateSimplifiedTex(originalTexPath: string): string {
  const texDir = path.dirname(originalTexPath);
  const original = fs.readFileSync(originalTexPath, 'utf-8');
  // Extract body after \begin{document}
  const marker = /\\begin\{document\}/i;
  const parts = original.split(marker);
  const body = parts.length > 1 ? parts.slice(1).join('\\begin{document}') : original;
  // Keep all \usepackage lines but strip only the ones that are known to cause issues
  // when packages are missing from the TeX distribution
  const bodyClean = body
    .replace(/\\usepackage\[[^\]]*\]\{tikz\}/g, '% tikz removed for compatibility')
    .replace(/\\usepackage\{tikz\}/g, '% tikz removed for compatibility')
    .replace(/\\usepackage\[[^\]]*\]\{listings\}/g, '% listings removed for compatibility')
    .replace(/\\usepackage\{listings\}/g, '% listings removed for compatibility');
  // Strip custom environment definitions that might reference missing packages
  const bodyCleaner = bodyClean.replace(/\\newtcolorbox\{[^}]+\}\{[^}]*\}/g, '');
  // Robust preamble with all common packages needed by generated documents
  const simplePreamble = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[english]{babel}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage[most]{tcolorbox}
\\usepackage{enumitem}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{longtable}
\\usepackage{float}
\\definecolor{unalblue}{RGB}{0,56,101}
\\definecolor{boxbg}{RGB}{245,248,250}
\\newtcolorbox{resultbox}[1][]{colback=boxbg,colframe=unalblue,title=#1,fonttitle=\\bfseries}
\\newtcolorbox{gapbox}[1][]{colback=gray!5,colframe=black!30,boxrule=0.3pt,title=\\textit{#1}}
\\usepackage[hidelinks]{hyperref}
\\begin{document}
`;
  const simpleTex = simplePreamble + '\n' + bodyCleaner;
  const simplePath = path.join(texDir, path.basename(originalTexPath).replace('.tex', '.simple.tex'));
  fs.writeFileSync(simplePath, simpleTex, 'utf-8');
  return simplePath;
}

// Generate a patched tex file that injects basic environment definitions for missing environments
function generateTexWithEnvDefinitions(originalTexPath: string, envNames: string[]): string {
  const texDir = path.dirname(originalTexPath);
  const original = fs.readFileSync(originalTexPath, 'utf-8');
  const marker = /\\begin\{document\}/i;
  const parts = original.split(marker);
  const preamble = parts.length > 1 ? parts[0] : '';
  const rest = parts.length > 1 ? parts.slice(1).join('\\begin{document}') : original;

  // Basic tcolorbox definitions to cover common custom boxes like resultbox and gapbox
  const defs: string[] = [];
  if (envNames.includes('resultbox') || envNames.includes('gapbox')) {
    defs.push('\\usepackage{tcolorbox}');
  }

  // Minimal definitions — keep them simple and safe
  if (envNames.includes('resultbox')) {
    defs.push(`\\newtcolorbox{resultbox}[1][]{colback=boxbg,colframe=unalblue,title=##1,fonttitle=\\bfseries}`);
  }
  if (envNames.includes('gapbox')) {
    defs.push(`\\newtcolorbox{gapbox}[1][]{colback=gray!5,colframe=black!30,boxrule=0.3pt,title=\\textit{##1}}`);
  }

  const injection = defs.join('\n') + '\n';
  const patchedPreamble = preamble + '\n' + injection + '\n\\begin{document}\n';
  const patchedContent = patchedPreamble + rest;
  const patchedPath = path.join(texDir, path.basename(originalTexPath).replace('.tex', '.patched.tex'));
  fs.writeFileSync(patchedPath, patchedContent, 'utf-8');
  return patchedPath;
}

// Parse logs for "Environment X undefined" messages
function parseUndefinedEnvironmentsFromLog(logContent: string): string[] {
  const envs: Set<string> = new Set();
  if (!logContent) return [];
  const regex = /Environment\s+([A-Za-z0-9_]+)\s+undefined/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(logContent)) !== null) {
    if (m[1]) envs.add(m[1]);
  }

  // Also look for 'Undefined control sequence' patterns that reference \begin{...}
  const beginRegex = /\\begin\{([A-Za-z0-9_]+)\}/g;
  while ((m = beginRegex.exec(logContent)) !== null) {
    if (m[1]) {
      // heuristically include if not common envs
      const name = m[1];
      if (!['document', 'figure', 'table', 'itemize', 'enumerate'].includes(name)) envs.add(name);
    }
  }

  return Array.from(envs);
}

function dockerFallbackCompile(
  texFilePath: string,
  _config: PDFOutputConfig
): { success: boolean; error?: string; logPath?: string; logSnippet?: string; missingPackages?: string[]; suggestedPackages?: string[] } {
  try {
    const texDir = path.dirname(texFilePath);
    const texFileName = path.basename(texFilePath);

    // Build docker command to run pdflatex inside a latex image, mounting the texDir to /data
    // Use a well-known image like blang/latex:ctanfull which contains most packages
    const dockerCmd = [
      'run',
      '--rm',
      '-v',
      `${texDir}:/data`,
      '-w',
      '/data',
      'blang/latex:ctanfull',
      'pdflatex',
      '-interaction=nonstopmode',
      texFileName,
    ];

    const spawnResult = spawnSync('docker', dockerCmd, { encoding: 'utf-8', timeout: 120000 });
    const stdout = spawnResult.stdout || '';
    const stderr = spawnResult.stderr || '';
    const combined = ['--- DOCKER STDOUT ---', stdout, '--- DOCKER STDERR ---', stderr].join('\n');

    const logFileName = `${texFileName}.pdflatex.docker.log`;
    const logPath = path.join(texDir, logFileName);
    try {
      fs.writeFileSync(logPath, combined, 'utf-8');
    } catch (e) {
      console.warn('Failed to write docker pdflatex log file:', e);
    }

    const pdfPath = path.join(texDir, texFileName.replace('.tex', '.pdf'));
    if (fs.existsSync(pdfPath)) {
      return { success: true };
    }

    const snippet = combined.slice(0, 2000);
    const missing = parseMissingPackagesFromLog(combined);
    const suggested = missing.length > 0 ? suggestTexlivePackagesForStyNames(missing) : [];

    const errorMsg = spawnResult.error?.message || stderr || 'Docker pdflatex failed';
    return { success: false, error: errorMsg, logPath, logSnippet: snippet, missingPackages: missing, suggestedPackages: suggested };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Docker compilation failed';
    return { success: false, error: message };
  }
}

// ============================================================================
// Check pdflatex Availability
// ============================================================================
function checkPdfLatexAvailable(): boolean {
  try {
    const version = execSync("pdflatex --version", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return version.includes("pdfTeX");
  } catch {
    return false;
  }
}

// ============================================================================
// Cleanup Temporary Files
// ============================================================================
function cleanupLatexTempFiles(directory: string, baseName: string): void {
  const tempExtensions = [".aux", ".log", ".out", ".toc", ".lof", ".lot", ".fls", ".fdb_latexmk"];

  for (const ext of tempExtensions) {
    const filePath = path.join(directory, baseName + ext);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to clean up ${filePath}:`, error);
    }
  }
}

// ============================================================================
// Batch PDF Generation
// ============================================================================
export async function generatePDFBatch(
  texFiles: Array<{ texPath: string; outputName?: string }>,
  config?: PDFOutputConfig
): Promise<PDFConversionResult[]> {
  const finalConfig = config || getDefaultPDFConfig();
  const results: PDFConversionResult[] = [];

  for (const file of texFiles) {
    const result = await compileLaTeXToPDF(file.texPath, file.outputName, finalConfig);
    results.push(result);

    // Log progress
    if (result.success) {
      console.log(`✓ ${file.texPath} → ${result.pdfFilePath}`);
    } else {
      console.error(`✗ ${file.texPath} failed: ${result.error}`);
    }
  }

  return results;
}

// ============================================================================
// Get Generated PDFs List
// ============================================================================
export function listGeneratedPDFs(config?: PDFOutputConfig): Array<{
  fileName: string;
  filePath: string;
  fileSize: number;
  createdAt: Date;
}> {
  const finalConfig = config || getDefaultPDFConfig();

  if (!fs.existsSync(finalConfig.outputDir)) {
    return [];
  }

  const files = fs.readdirSync(finalConfig.outputDir);
  const pdfFiles = files.filter((f) => f.endsWith(".pdf"));

  return pdfFiles.map((fileName) => {
    const filePath = path.join(finalConfig.outputDir, fileName);
    const stats = fs.statSync(filePath);
    return {
      fileName,
      filePath,
      fileSize: stats.size,
      createdAt: stats.birthtime || stats.mtime,
    };
  });
}

// ============================================================================
// Cleanup Old PDFs
// ============================================================================
export function cleanupOldPDFs(
  daysOld: number = 7,
  config?: PDFOutputConfig
): { cleaned: string[]; errors: string[] } {
  const finalConfig = config || getDefaultPDFConfig();
  const cleaned: string[] = [];
  const errors: string[] = [];

  if (!fs.existsSync(finalConfig.outputDir)) {
    return { cleaned, errors };
  }

  const now = Date.now();
  const maxAge = daysOld * 24 * 60 * 60 * 1000;

  const files = fs.readdirSync(finalConfig.outputDir);

  for (const file of files) {
    if (!file.endsWith(".pdf")) continue;

    const filePath = path.join(finalConfig.outputDir, file);
    const stats = fs.statSync(filePath);
    const age = now - stats.mtime.getTime();

    if (age > maxAge) {
      try {
        fs.unlinkSync(filePath);
        cleaned.push(file);
      } catch (error) {
        errors.push(`Failed to delete ${file}: ${error}`);
      }
    }
  }

  return { cleaned, errors };
}

// ============================================================================
// Update .env File with PDF Config
// ============================================================================
export function updateEnvWithPDFConfig(envPath: string, config: Partial<PDFOutputConfig>): boolean {
  try {
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    const lines = envContent.split("\n");
    const keyMap = {
      outputDir: "PDF_OUTPUT_DIR",
      tempDir: "LATEX_TEMP_DIR",
      cleanupTemp: "CLEANUP_TEMP",
    };

    const updated = new Set<string>();

    for (const [key, envKey] of Object.entries(keyMap)) {
      if (key in config) {
        const value = config[key as keyof PDFOutputConfig];
        const envLine = `${envKey}=${value}`;

        const lineIndex = lines.findIndex((l) => l.startsWith(envKey));
        if (lineIndex >= 0) {
          lines[lineIndex] = envLine;
        } else {
          lines.push(envLine);
        }

        updated.add(key);
      }
    }

    if (updated.size > 0) {
      fs.writeFileSync(envPath, lines.join("\n"));
      console.log(`Updated .env with PDF configuration: ${Array.from(updated).join(", ")}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Failed to update .env file:", error);
    return false;
  }
}
