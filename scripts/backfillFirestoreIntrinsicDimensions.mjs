#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';
import { imageSize } from 'image-size';

const DEFAULTS = {
  collection: 'memes',
  pathField: 'storagePath',
  urlField: 'imageUrl',
  widthField: 'width',
  heightField: 'height',
  aspectRatioField: 'aspectRatio',
  dimensionSourceField: 'dimensionSource',
  dimensionsVerifiedAtField: 'dimensionsVerifiedAt',
  verifiedSourceValue: 'verified',
  aspectPrecision: 6,
  batchSize: 100,
  limit: 0,
  docId: '',
  startAfter: '',
  projectId: '',
  bucket: '',
  serviceAccount: '',
  fix: false,
  verbose: false,
  reportJson: '',
  reportCsv: '',
};

const STATUS = {
  UPDATED: 'updated',
  WOULD_UPDATE: 'would_update',
  UNCHANGED: 'unchanged',
  SKIPPED: 'skipped',
  FAILED: 'failed',
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
      case 'path-field':
        config.pathField = value ?? config.pathField;
        break;
      case 'url-field':
        config.urlField = value ?? config.urlField;
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
      case 'dimensions-verified-at-field':
        config.dimensionsVerifiedAtField = value ?? config.dimensionsVerifiedAtField;
        break;
      case 'verified-source-value':
        config.verifiedSourceValue = value ?? config.verifiedSourceValue;
        break;
      case 'aspect-precision':
        config.aspectPrecision = parseIntegerInRange(value, '--aspect-precision', 4, 8, config.aspectPrecision);
        break;
      case 'batch-size':
        config.batchSize = parseIntegerInRange(value, '--batch-size', 1, 1000, config.batchSize);
        break;
      case 'limit':
        config.limit = parseIntegerInRange(value, '--limit', 0, Number.MAX_SAFE_INTEGER, config.limit);
        break;
      case 'doc-id':
        config.docId = value ?? config.docId;
        break;
      case 'start-after':
        config.startAfter = value ?? config.startAfter;
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
      case 'report-json':
        config.reportJson = value ?? config.reportJson;
        break;
      case 'report-csv':
        config.reportCsv = value ?? config.reportCsv;
        break;
      case 'fix':
        config.fix = true;
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

  if (config.docId && config.startAfter) {
    throw new Error('Use either --doc-id or --start-after, not both.');
  }

  if (!config.collection) {
    throw new Error('--collection is required.');
  }

  return config;
}

function parseIntegerInRange(value, flag, min, max, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${flag} must be an integer between ${min} and ${max}.`);
  }

  return parsed;
}

function printHelpAndExit(code) {
  console.log(`
Backfill verified intrinsic image dimensions from Firebase Storage to Firestore.

Usage:
  node scripts/backfillFirestoreIntrinsicDimensions.mjs [options]

Safety:
  - Default mode is dry-run (no writes).
  - Writes happen only with --fix.

Options:
  --collection <name>                  Firestore collection (default: memes)
  --path-field <name>                  Field with Storage path (default: storagePath)
  --url-field <name>                   Field with download URL fallback (default: imageUrl)
  --width-field <name>                 Output width field (default: width)
  --height-field <name>                Output height field (default: height)
  --aspect-ratio-field <name>          Output aspect ratio field (default: aspectRatio)
  --dimension-source-field <name>      Output source field (default: dimensionSource)
  --dimensions-verified-at-field <n>   Output verified time field (default: dimensionsVerifiedAt)
  --verified-source-value <value>      Value for source field (default: verified)
  --aspect-precision <n>               Ratio decimal precision 4-8 (default: 6)
  --batch-size <n>                     Batch size for paged scans (default: 100)
  --limit <n>                          Max docs to scan, 0 = all (default: 0)
  --doc-id <id>                        Process one document only
  --start-after <docId>                Start after this document id
  --project-id <id>                    Override Firebase project id
  --bucket <bucket-name>               Override default Storage bucket
  --service-account <path>             Service account JSON path
  --report-json <path>                 Optional JSON report output path
  --report-csv <path>                  Optional CSV report output path
  --fix                                Apply updates to Firestore
  --verbose                            Log unchanged docs too
  --help                               Show this help

Credentials:
  1) --service-account /path/key.json
  2) GOOGLE_APPLICATION_CREDENTIALS env var
  3) ADC (application default credentials)
`);
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
    appOptions.credential = admin.credential.cert(JSON.parse(raw));
  } else {
    appOptions.credential = admin.credential.applicationDefault();
  }

  admin.initializeApp(appOptions);
}

function parseFiniteNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parsePositiveInteger(value) {
  const parsed = parseFiniteNumber(value);
  if (parsed === null || parsed <= 0) {
    return null;
  }
  return Math.round(parsed);
}

function roundTo(value, precision) {
  if (!Number.isFinite(value)) {
    return null;
  }
  return Number(value.toFixed(precision));
}

function valuesEqual(a, b, epsilon = 1e-6) {
  if (a === null || b === null) {
    return a === b;
  }
  return Math.abs(a - b) <= epsilon;
}

function normalizeStorageReference(rawReference, defaultBucketName) {
  if (typeof rawReference !== 'string') {
    return null;
  }

  const trimmed = rawReference.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('gs://')) {
    const withoutScheme = trimmed.slice('gs://'.length);
    const slashIndex = withoutScheme.indexOf('/');
    if (slashIndex <= 0 || slashIndex === withoutScheme.length - 1) {
      return null;
    }

    return {
      bucket: withoutScheme.slice(0, slashIndex),
      path: withoutScheme.slice(slashIndex + 1),
      sourceType: 'gs_url',
    };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);

      const firebaseMatch = url.pathname.match(/\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (firebaseMatch) {
        return {
          bucket: decodeURIComponent(firebaseMatch[1]),
          path: decodeURIComponent(firebaseMatch[2]),
          sourceType: 'firebase_download_url',
        };
      }

      if (url.hostname === 'storage.googleapis.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return {
            bucket: decodeURIComponent(parts[0]),
            path: decodeURIComponent(parts.slice(1).join('/')),
            sourceType: 'gcs_http_url',
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
    sourceType: 'relative_storage_path',
  };
}

function resolveDocumentStorageObject({ docData, config, defaultBucketName }) {
  const pathValue = docData[config.pathField];
  const urlValue = docData[config.urlField];

  const normalizedPath = normalizeStorageReference(pathValue, defaultBucketName);
  if (normalizedPath) {
    return {
      ...normalizedPath,
      chosenField: config.pathField,
      chosenValue: pathValue,
    };
  }

  const normalizedUrl = normalizeStorageReference(urlValue, defaultBucketName);
  if (normalizedUrl) {
    return {
      ...normalizedUrl,
      chosenField: config.urlField,
      chosenValue: urlValue,
    };
  }

  return null;
}

async function fetchActualDimensions({ storageRef }) {
  const bucket = admin.storage().bucket(storageRef.bucket);
  const file = bucket.file(storageRef.path);

  const [exists] = await file.exists();
  if (!exists) {
    const err = new Error(`Object not found: gs://${storageRef.bucket}/${storageRef.path}`);
    err.code = 'STORAGE_NOT_FOUND';
    throw err;
  }

  const [buffer] = await file.download();
  const dimensions = imageSize(buffer);

  if (!dimensions.width || !dimensions.height) {
    const err = new Error('Unable to extract intrinsic dimensions from image bytes.');
    err.code = 'DIMENSIONS_UNREADABLE';
    throw err;
  }

  return {
    width: dimensions.width,
    height: dimensions.height,
  };
}

function buildTargetValues({ actualWidth, actualHeight, config }) {
  return {
    width: actualWidth,
    height: actualHeight,
    aspectRatio: roundTo(actualWidth / actualHeight, config.aspectPrecision),
    dimensionSource: config.verifiedSourceValue,
  };
}

function buildComparison({ docData, target, config }) {
  const existingWidth = parsePositiveInteger(docData[config.widthField]);
  const existingHeight = parsePositiveInteger(docData[config.heightField]);
  const existingAspectRatio = parseFiniteNumber(docData[config.aspectRatioField]);
  const existingDimensionSource = typeof docData[config.dimensionSourceField] === 'string'
    ? docData[config.dimensionSourceField]
    : null;

  const epsilon = Number(`1e-${config.aspectPrecision}`);

  const changes = {};

  if (!valuesEqual(existingWidth, target.width, 0)) {
    changes[config.widthField] = { from: existingWidth, to: target.width };
  }

  if (!valuesEqual(existingHeight, target.height, 0)) {
    changes[config.heightField] = { from: existingHeight, to: target.height };
  }

  if (!valuesEqual(existingAspectRatio, target.aspectRatio, epsilon)) {
    changes[config.aspectRatioField] = { from: existingAspectRatio, to: target.aspectRatio };
  }

  if (existingDimensionSource !== target.dimensionSource) {
    changes[config.dimensionSourceField] = { from: existingDimensionSource, to: target.dimensionSource };
  }

  const needsUpdate = Object.keys(changes).length > 0;

  return {
    existing: {
      width: existingWidth,
      height: existingHeight,
      aspectRatio: existingAspectRatio,
      dimensionSource: existingDimensionSource,
    },
    changes,
    needsUpdate,
  };
}

function buildUpdatePayload({ target, config }) {
  return {
    [config.widthField]: target.width,
    [config.heightField]: target.height,
    [config.aspectRatioField]: target.aspectRatio,
    [config.dimensionSourceField]: target.dimensionSource,
    [config.dimensionsVerifiedAtField]: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function csvEscape(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function toCsv(reportRows) {
  const headers = [
    'docId',
    'status',
    'reason',
    'resolvedBucket',
    'resolvedPath',
    'widthFrom',
    'widthTo',
    'heightFrom',
    'heightTo',
    'aspectRatioFrom',
    'aspectRatioTo',
    'dimensionSourceFrom',
    'dimensionSourceTo',
    'errorCode',
    'errorMessage',
  ];

  const lines = [headers.join(',')];
  for (const row of reportRows) {
    const values = headers.map((key) => csvEscape(row[key]));
    lines.push(values.join(','));
  }

  return `${lines.join('\n')}\n`;
}

function flattenForCsv(item) {
  return {
    docId: item.docId,
    status: item.status,
    reason: item.reason || '',
    resolvedBucket: item.storage?.bucket || '',
    resolvedPath: item.storage?.path || '',
    widthFrom: item.changes?.width?.from ?? '',
    widthTo: item.changes?.width?.to ?? '',
    heightFrom: item.changes?.height?.from ?? '',
    heightTo: item.changes?.height?.to ?? '',
    aspectRatioFrom: item.changes?.aspectRatio?.from ?? '',
    aspectRatioTo: item.changes?.aspectRatio?.to ?? '',
    dimensionSourceFrom: item.changes?.dimensionSource?.from ?? '',
    dimensionSourceTo: item.changes?.dimensionSource?.to ?? '',
    errorCode: item.errorCode || '',
    errorMessage: item.errorMessage || '',
  };
}

async function getDocumentsToProcess({ db, config }) {
  if (config.docId) {
    const snap = await db.collection(config.collection).doc(config.docId).get();
    if (!snap.exists) {
      throw new Error(`Document not found: ${config.collection}/${config.docId}`);
    }
    return [snap];
  }

  const docs = [];
  let remaining = config.limit > 0 ? config.limit : Number.POSITIVE_INFINITY;
  let cursor = config.startAfter || null;

  while (remaining > 0) {
    const pageSize = Math.min(config.batchSize, remaining);

    let query = db
      .collection(config.collection)
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(pageSize);

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      break;
    }

    for (const docSnap of snapshot.docs) {
      if (remaining <= 0) {
        break;
      }
      docs.push(docSnap);
      remaining -= 1;
    }

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];
    cursor = lastDoc.id;

    if (snapshot.size < pageSize) {
      break;
    }
  }

  return docs;
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  initFirebase(config);

  const db = admin.firestore();
  const defaultBucket = admin.storage().bucket(config.bucket || undefined);
  const defaultBucketName = defaultBucket.name;
  const mode = config.fix ? 'fix' : 'dry-run';

  console.log('Starting dimension backfill with config:');
  console.log(JSON.stringify({
    mode,
    collection: config.collection,
    pathField: config.pathField,
    urlField: config.urlField,
    widthField: config.widthField,
    heightField: config.heightField,
    aspectRatioField: config.aspectRatioField,
    dimensionSourceField: config.dimensionSourceField,
    dimensionsVerifiedAtField: config.dimensionsVerifiedAtField,
    verifiedSourceValue: config.verifiedSourceValue,
    aspectPrecision: config.aspectPrecision,
    batchSize: config.batchSize,
    limit: config.limit,
    docId: config.docId || null,
    startAfter: config.startAfter || null,
    bucket: defaultBucketName,
    reportJson: config.reportJson || null,
    reportCsv: config.reportCsv || null,
  }, null, 2));

  const summary = {
    scanned: 0,
    updated: 0,
    wouldUpdate: 0,
    unchanged: 0,
    skipped: 0,
    failed: 0,
  };

  const updatedDocs = [];
  const unchangedDocs = [];
  const skippedDocs = [];
  const failedDocs = [];

  const docSnaps = await getDocumentsToProcess({ db, config });

  for (const docSnap of docSnaps) {
    summary.scanned += 1;
    const docData = docSnap.data() || {};

    const storageRef = resolveDocumentStorageObject({
      docData,
      config,
      defaultBucketName,
    });

    if (!storageRef) {
      summary.skipped += 1;
      const skipped = {
        status: STATUS.SKIPPED,
        docId: docSnap.id,
        reason: `No valid storage reference in ${config.pathField} or ${config.urlField}`,
      };
      skippedDocs.push(skipped);
      console.log(`[SKIP] ${docSnap.id}: ${skipped.reason}`);
      continue;
    }

    try {
      const actual = await fetchActualDimensions({ storageRef });
      const target = buildTargetValues({
        actualWidth: actual.width,
        actualHeight: actual.height,
        config,
      });

      const comparison = buildComparison({ docData, target, config });

      if (!comparison.needsUpdate) {
        summary.unchanged += 1;
        const unchanged = {
          status: STATUS.UNCHANGED,
          docId: docSnap.id,
          storage: {
            bucket: storageRef.bucket,
            path: storageRef.path,
          },
        };
        unchangedDocs.push(unchanged);
        if (config.verbose) {
          console.log(`[UNCHANGED] ${docSnap.id}`);
        }
        continue;
      }

      const updatePayload = buildUpdatePayload({ target, config });

      const formattedChanges = {
        [config.widthField]: comparison.changes[config.widthField] ?? null,
        [config.heightField]: comparison.changes[config.heightField] ?? null,
        [config.aspectRatioField]: comparison.changes[config.aspectRatioField] ?? null,
        [config.dimensionSourceField]: comparison.changes[config.dimensionSourceField] ?? null,
        [config.dimensionsVerifiedAtField]: {
          from: typeof docData[config.dimensionsVerifiedAtField] === 'undefined'
            ? null
            : '<existing_value>',
          to: '<serverTimestamp>',
        },
      };

      if (config.fix) {
        await docSnap.ref.update(updatePayload);
        summary.updated += 1;

        const updated = {
          status: STATUS.UPDATED,
          docId: docSnap.id,
          storage: {
            bucket: storageRef.bucket,
            path: storageRef.path,
          },
          reason: 'Applied verified intrinsic dimensions from Storage',
          changes: {
            width: comparison.changes[config.widthField] ?? null,
            height: comparison.changes[config.heightField] ?? null,
            aspectRatio: comparison.changes[config.aspectRatioField] ?? null,
            dimensionSource: comparison.changes[config.dimensionSourceField] ?? null,
          },
        };
        updatedDocs.push(updated);

        console.log(`[UPDATE] ${docSnap.id}: ${JSON.stringify(formattedChanges)}`);
      } else {
        summary.wouldUpdate += 1;

        const wouldUpdate = {
          status: STATUS.WOULD_UPDATE,
          docId: docSnap.id,
          storage: {
            bucket: storageRef.bucket,
            path: storageRef.path,
          },
          reason: 'Would apply verified intrinsic dimensions from Storage',
          changes: {
            width: comparison.changes[config.widthField] ?? null,
            height: comparison.changes[config.heightField] ?? null,
            aspectRatio: comparison.changes[config.aspectRatioField] ?? null,
            dimensionSource: comparison.changes[config.dimensionSourceField] ?? null,
          },
        };
        updatedDocs.push(wouldUpdate);

        console.log(`[DRY-RUN] ${docSnap.id}: ${JSON.stringify(formattedChanges)}`);
      }
    } catch (error) {
      summary.failed += 1;

      const failed = {
        status: STATUS.FAILED,
        docId: docSnap.id,
        storage: {
          bucket: storageRef.bucket,
          path: storageRef.path,
        },
        reason: 'Could not read Storage object dimensions',
        errorCode: error?.code || 'UNKNOWN_ERROR',
        errorMessage: error?.message || String(error),
      };

      failedDocs.push(failed);
      console.log(`[FAIL] ${docSnap.id}: ${failed.errorCode} ${failed.errorMessage}`);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    config: {
      collection: config.collection,
      pathField: config.pathField,
      urlField: config.urlField,
      widthField: config.widthField,
      heightField: config.heightField,
      aspectRatioField: config.aspectRatioField,
      dimensionSourceField: config.dimensionSourceField,
      dimensionsVerifiedAtField: config.dimensionsVerifiedAtField,
      verifiedSourceValue: config.verifiedSourceValue,
      aspectPrecision: config.aspectPrecision,
      batchSize: config.batchSize,
      limit: config.limit,
      docId: config.docId || null,
      startAfter: config.startAfter || null,
      bucket: defaultBucketName,
    },
    summary,
    updatedDocs,
    unchangedDocs,
    skippedDocs,
    failedDocs,
  };

  if (config.reportJson) {
    const jsonPath = path.resolve(config.reportJson);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`JSON report written: ${jsonPath}`);
  }

  if (config.reportCsv) {
    const rows = [
      ...updatedDocs.map(flattenForCsv),
      ...unchangedDocs.map(flattenForCsv),
      ...skippedDocs.map(flattenForCsv),
      ...failedDocs.map(flattenForCsv),
    ];

    const csvPath = path.resolve(config.reportCsv);
    fs.mkdirSync(path.dirname(csvPath), { recursive: true });
    fs.writeFileSync(csvPath, toCsv(rows), 'utf8');
    console.log(`CSV report written: ${csvPath}`);
  }

  console.log('\nRun summary:');
  console.log(JSON.stringify(summary, null, 2));

  if (!config.fix) {
    console.log('\nDry-run only. Re-run with --fix to apply writes.');
  }
}

main().catch((error) => {
  console.error('Fatal error in dimension backfill script:');
  console.error(error);
  process.exit(1);
});
