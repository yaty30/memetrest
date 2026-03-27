#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';
import { imageSize } from 'image-size';

const DEFAULTS = {
  collection: 'memes',
  imagePathField: 'storagePath',
  imageUrlField: 'imageUrl',
  widthField: 'width',
  heightField: 'height',
  aspectRatioField: 'aspectRatio',
  dimensionSourceField: 'dimensionSource',
  batchSize: 200,
  limit: 0,
  outputJson: './dimension-audit-results.json',
  outputCsv: '',
  fix: false,
  dryRun: false,
  projectId: '',
  bucket: '',
  serviceAccount: '',
  verbose: false,
};

const STATUS = {
  MATCH: 'match',
  MISMATCH: 'mismatch',
  MISSING_FIRESTORE_DIMENSIONS: 'missing_firestore_dimensions',
  MISSING_IMAGE_REFERENCE: 'missing_image_reference',
  MISSING_STORAGE_OBJECT: 'missing_storage_object',
  UNREADABLE_IMAGE: 'unreadable_image',
};

const RATIO_RESULT = {
  EXACT_SIZE_MATCH: 'exact_size_matches',
  RATIO_MATCH_SIZE_DIFFERS: 'ratio_matches_but_pixel_size_differs',
  RATIO_MISMATCH: 'ratio_mismatches',
  UNKNOWN: 'unknown',
};

function parseArgs(argv) {
  const config = { ...DEFAULTS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (!arg.startsWith('--')) {
      continue;
    }

    const [rawKey, rawInlineValue] = arg.split('=');
    const key = rawKey.slice(2);
    const next = argv[i + 1];
    const hasInlineValue = rawInlineValue !== undefined;
    const hasSeparateValue = next && !next.startsWith('--');
    const value = hasInlineValue ? rawInlineValue : hasSeparateValue ? next : undefined;

    if (!hasInlineValue && hasSeparateValue) {
      i += 1;
    }

    switch (key) {
      case 'collection':
        config.collection = value ?? config.collection;
        break;
      case 'image-path-field':
        config.imagePathField = value ?? config.imagePathField;
        break;
      case 'image-url-field':
        config.imageUrlField = value ?? config.imageUrlField;
        break;
      case 'width-field':
        config.widthField = value ?? config.widthField;
        break;
      case 'height-field':
        config.heightField = value ?? config.heightField;
        break;
      case 'aspect-ratio-field':
        config.aspectRatioField = value ?? config.aspectRatioField;
        break;
      case 'dimension-source-field':
        config.dimensionSourceField = value ?? config.dimensionSourceField;
        break;
      case 'batch-size':
        config.batchSize = parsePositiveInt(value, '--batch-size', config.batchSize);
        break;
      case 'limit':
        config.limit = parseNonNegativeInt(value, '--limit', config.limit);
        break;
      case 'output-json':
        config.outputJson = value ?? config.outputJson;
        break;
      case 'output-csv':
        config.outputCsv = value ?? config.outputCsv;
        break;
      case 'fix':
        config.fix = true;
        break;
      case 'dry-run':
        config.dryRun = true;
        break;
      case 'project-id':
        config.projectId = value ?? config.projectId;
        break;
      case 'bucket':
        config.bucket = value ?? config.bucket;
        break;
      case 'service-account':
        config.serviceAccount = value ?? config.serviceAccount;
        break;
      case 'verbose':
        config.verbose = true;
        break;
      case 'help':
      case 'h':
        printHelpAndExit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (config.fix && config.dryRun) {
    throw new Error('Cannot use --fix and --dry-run together.');
  }

  return config;
}

function parsePositiveInt(value, flag, fallback) {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

function parseNonNegativeInt(value, flag, fallback) {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer.`);
  }
  return parsed;
}

function printHelpAndExit(code) {
  console.log(`\nFirestore image dimension verifier\n\nUsage:\n  node scripts/verifyFirestoreImageDimensions.mjs [options]\n\nOptions:\n  --collection <name>               Firestore collection (default: memes)\n  --image-path-field <name>         Field with Storage path (default: storagePath)\n  --image-url-field <name>          Field with download URL fallback (default: imageUrl)\n  --width-field <name>              Width field in Firestore (default: width)\n  --height-field <name>             Height field in Firestore (default: height)\n  --aspect-ratio-field <name>       Aspect ratio field for fix mode (default: aspectRatio)\n  --dimension-source-field <name>   Source field for fix mode (default: dimensionSource)\n  --batch-size <n>                  Page size for Firestore query (default: 200)\n  --limit <n>                       Max docs to scan, 0 = no limit (default: 0)\n  --output-json <path>              JSON output path (default: ./dimension-audit-results.json)\n  --output-csv <path>               CSV output path (optional)\n  --project-id <id>                 Override Firebase project id\n  --bucket <bucket-name>            Override Storage bucket\n  --service-account <path>          Path to service account JSON\n  --fix                             Update Firestore with verified dimensions\n  --dry-run                         Explicit read-only audit mode\n  --verbose                         Log every record\n  --help                            Show this help\n\nCredential options:\n  1) --service-account /path/to/serviceAccount.json\n  2) GOOGLE_APPLICATION_CREDENTIALS env var\n  3) Application Default Credentials (ADC)\n`);
  process.exit(code);
}

function initFirebase(config) {
  const appOptions = {};

  if (config.projectId) {
    appOptions.projectId = config.projectId;
  }
  if (config.bucket) {
    appOptions.storageBucket = config.bucket;
  }

  if (config.serviceAccount) {
    const absolute = path.resolve(config.serviceAccount);
    const raw = fs.readFileSync(absolute, 'utf8');
    const serviceAccount = JSON.parse(raw);
    appOptions.credential = admin.credential.cert(serviceAccount);
  } else {
    appOptions.credential = admin.credential.applicationDefault();
  }

  admin.initializeApp(appOptions);
}

function normalizeStoragePath(input, defaultBucketName) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('gs://')) {
    const withoutScheme = trimmed.slice('gs://'.length);
    const firstSlash = withoutScheme.indexOf('/');
    if (firstSlash === -1) {
      return null;
    }
    return {
      bucket: withoutScheme.slice(0, firstSlash),
      path: withoutScheme.slice(firstSlash + 1),
      source: 'gs_url',
    };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);

      // Firebase download URL format: /v0/b/<bucket>/o/<encodedPath>
      const firebaseMatch = url.pathname.match(/\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (firebaseMatch) {
        return {
          bucket: decodeURIComponent(firebaseMatch[1]),
          path: decodeURIComponent(firebaseMatch[2]),
          source: 'firebase_download_url',
        };
      }

      // Google Cloud Storage URL format: /<bucket>/<path>
      if (url.hostname === 'storage.googleapis.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return {
            bucket: decodeURIComponent(parts[0]),
            path: decodeURIComponent(parts.slice(1).join('/')),
            source: 'gcs_http_url',
          };
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  return {
    bucket: defaultBucketName,
    path: trimmed,
    source: 'relative_storage_path',
  };
}

function parseDimension(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  return null;
}

function computeRatio(width, height) {
  if (!width || !height) {
    return null;
  }
  return width / height;
}

function approxEqual(a, b, epsilon = 1e-6) {
  return Math.abs(a - b) <= epsilon;
}

function classifyResult({ firestoreWidth, firestoreHeight, actualWidth, actualHeight, hasImageRef }) {
  if (!hasImageRef) {
    return { status: STATUS.MISSING_IMAGE_REFERENCE, ratioResult: RATIO_RESULT.UNKNOWN };
  }

  if (!actualWidth || !actualHeight) {
    return { status: STATUS.UNREADABLE_IMAGE, ratioResult: RATIO_RESULT.UNKNOWN };
  }

  if (!firestoreWidth || !firestoreHeight) {
    return {
      status: STATUS.MISSING_FIRESTORE_DIMENSIONS,
      ratioResult: RATIO_RESULT.UNKNOWN,
    };
  }

  if (firestoreWidth === actualWidth && firestoreHeight === actualHeight) {
    return {
      status: STATUS.MATCH,
      ratioResult: RATIO_RESULT.EXACT_SIZE_MATCH,
    };
  }

  const firestoreRatio = computeRatio(firestoreWidth, firestoreHeight);
  const actualRatio = computeRatio(actualWidth, actualHeight);
  const ratioMatches = firestoreRatio !== null
    && actualRatio !== null
    && approxEqual(firestoreRatio, actualRatio);

  return {
    status: STATUS.MISMATCH,
    ratioResult: ratioMatches
      ? RATIO_RESULT.RATIO_MATCH_SIZE_DIFFERS
      : RATIO_RESULT.RATIO_MISMATCH,
  };
}

function shouldFix(result) {
  return result.status === STATUS.MISMATCH
    || result.status === STATUS.MISSING_FIRESTORE_DIMENSIONS;
}

function toCsv(rows) {
  const headers = [
    'docId',
    'status',
    'ratioResult',
    'imageReferenceType',
    'resolvedBucket',
    'resolvedPath',
    'firestoreWidth',
    'firestoreHeight',
    'actualWidth',
    'actualHeight',
    'firestoreRatio',
    'actualRatio',
    'errorCode',
    'errorMessage',
    'fixed',
  ];

  const lines = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((key) => csvEscape(row[key]));
    lines.push(values.join(','));
  }

  return `${lines.join('\n')}\n`;
}

function csvEscape(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  initFirebase(config);

  const db = admin.firestore();
  const defaultBucket = admin.storage().bucket(config.bucket || undefined);
  const defaultBucketName = defaultBucket.name;

  console.log('Starting Firestore image dimension audit with config:');
  console.log(JSON.stringify({
    collection: config.collection,
    imagePathField: config.imagePathField,
    imageUrlField: config.imageUrlField,
    widthField: config.widthField,
    heightField: config.heightField,
    aspectRatioField: config.aspectRatioField,
    dimensionSourceField: config.dimensionSourceField,
    batchSize: config.batchSize,
    limit: config.limit,
    outputJson: config.outputJson,
    outputCsv: config.outputCsv || null,
    fix: config.fix,
    dryRun: config.dryRun,
    defaultBucket: defaultBucketName,
  }, null, 2));

  const results = [];
  const summary = {
    totalRecordsScanned: 0,
    matches: 0,
    mismatches: 0,
    missingMetadata: 0,
    missingImageReference: 0,
    missingFiles: 0,
    unreadableFiles: 0,
    ratioMatchesButPixelDiffers: 0,
    ratioMismatches: 0,
    fixedRecords: 0,
  };

  let lastDoc = null;
  let remaining = config.limit > 0 ? config.limit : Number.POSITIVE_INFINITY;

  while (remaining > 0) {
    const pageSize = Math.min(config.batchSize, remaining);

    let query = db
      .collection(config.collection)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    for (const docSnap of snapshot.docs) {
      if (remaining <= 0) {
        break;
      }

      remaining -= 1;
      summary.totalRecordsScanned += 1;

      const docData = docSnap.data() || {};
      const pathValue = docData[config.imagePathField];
      const urlValue = docData[config.imageUrlField];
      const chosenReference = typeof pathValue === 'string' && pathValue.trim()
        ? pathValue
        : urlValue;

      const resolved = normalizeStoragePath(chosenReference, defaultBucketName);
      const hasImageRef = Boolean(resolved);
      const firestoreWidth = parseDimension(docData[config.widthField]);
      const firestoreHeight = parseDimension(docData[config.heightField]);

      let actualWidth = null;
      let actualHeight = null;
      let status = STATUS.MATCH;
      let ratioResult = RATIO_RESULT.UNKNOWN;
      let errorCode = '';
      let errorMessage = '';
      let fixed = false;

      if (!hasImageRef) {
        status = STATUS.MISSING_IMAGE_REFERENCE;
      } else {
        try {
          const bucket = admin.storage().bucket(resolved.bucket || defaultBucketName);
          const file = bucket.file(resolved.path);
          const [exists] = await file.exists();

          if (!exists) {
            status = STATUS.MISSING_STORAGE_OBJECT;
            errorCode = 'STORAGE_NOT_FOUND';
            errorMessage = `Object not found: gs://${bucket.name}/${resolved.path}`;
          } else {
            const [buffer] = await file.download();
            const dimensions = imageSize(buffer);

            if (!dimensions.width || !dimensions.height) {
              status = STATUS.UNREADABLE_IMAGE;
              errorCode = 'NO_DIMENSIONS';
              errorMessage = 'Unable to read intrinsic image dimensions.';
            } else {
              actualWidth = dimensions.width;
              actualHeight = dimensions.height;

              const classified = classifyResult({
                firestoreWidth,
                firestoreHeight,
                actualWidth,
                actualHeight,
                hasImageRef,
              });

              status = classified.status;
              ratioResult = classified.ratioResult;

              if (config.fix && shouldFix({ status })) {
                const updates = {
                  [config.widthField]: actualWidth,
                  [config.heightField]: actualHeight,
                  [config.aspectRatioField]: Number((actualWidth / actualHeight).toFixed(8)),
                  [config.dimensionSourceField]: 'verified',
                };

                await docSnap.ref.update(updates);
                fixed = true;
                summary.fixedRecords += 1;
              }
            }
          }
        } catch (error) {
          status = STATUS.UNREADABLE_IMAGE;
          errorCode = error?.code || 'READ_ERROR';
          errorMessage = error?.message || String(error);
        }
      }

      const firestoreRatio = computeRatio(firestoreWidth, firestoreHeight);
      const actualRatio = computeRatio(actualWidth, actualHeight);

      if (status === STATUS.MATCH) {
        summary.matches += 1;
      } else if (status === STATUS.MISMATCH) {
        summary.mismatches += 1;
      } else if (status === STATUS.MISSING_FIRESTORE_DIMENSIONS) {
        summary.missingMetadata += 1;
      } else if (status === STATUS.MISSING_IMAGE_REFERENCE) {
        summary.missingImageReference += 1;
      } else if (status === STATUS.MISSING_STORAGE_OBJECT) {
        summary.missingFiles += 1;
      } else if (status === STATUS.UNREADABLE_IMAGE) {
        summary.unreadableFiles += 1;
      }

      if (ratioResult === RATIO_RESULT.RATIO_MATCH_SIZE_DIFFERS) {
        summary.ratioMatchesButPixelDiffers += 1;
      } else if (ratioResult === RATIO_RESULT.RATIO_MISMATCH) {
        summary.ratioMismatches += 1;
      }

      const row = {
        docId: docSnap.id,
        status,
        ratioResult,
        imageReferenceType: resolved?.source || 'none',
        resolvedBucket: resolved?.bucket || '',
        resolvedPath: resolved?.path || '',
        firestoreWidth,
        firestoreHeight,
        actualWidth,
        actualHeight,
        firestoreRatio: firestoreRatio === null ? null : Number(firestoreRatio.toFixed(8)),
        actualRatio: actualRatio === null ? null : Number(actualRatio.toFixed(8)),
        errorCode,
        errorMessage,
        fixed,
      };

      results.push(row);

      if (config.verbose || status !== STATUS.MATCH) {
        console.log(`[${summary.totalRecordsScanned}] ${docSnap.id} -> ${status}`
          + (ratioResult && ratioResult !== RATIO_RESULT.UNKNOWN ? ` (${ratioResult})` : '')
          + (fixed ? ' [fixed]' : ''));
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < pageSize) {
      break;
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    mode: config.fix ? 'fix' : config.dryRun ? 'dry-run' : 'audit',
    config: {
      collection: config.collection,
      imagePathField: config.imagePathField,
      imageUrlField: config.imageUrlField,
      widthField: config.widthField,
      heightField: config.heightField,
      aspectRatioField: config.aspectRatioField,
      dimensionSourceField: config.dimensionSourceField,
      batchSize: config.batchSize,
      limit: config.limit,
      bucket: defaultBucketName,
    },
    summary,
    results,
  };

  const jsonPath = path.resolve(config.outputJson);
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));

  if (config.outputCsv) {
    const csvPath = path.resolve(config.outputCsv);
    fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    fs.writeFileSync(csvPath, toCsv(results), 'utf8');
  }

  console.log('\nAudit complete.');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`JSON report: ${jsonPath}`);
  if (config.outputCsv) {
    console.log(`CSV report: ${path.resolve(config.outputCsv)}`);
  }
}

main().catch((error) => {
  console.error('Fatal error while auditing dimensions:');
  console.error(error);
  process.exit(1);
});
