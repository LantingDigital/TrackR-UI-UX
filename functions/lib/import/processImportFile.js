"use strict";
/**
 * processImportFile — Callable Cloud Function
 *
 * Receives an uploaded file (as base64) and returns structured import data.
 * Supports CSV, Excel (.xlsx/.xls), JSON, and TSV formats.
 *
 * Processing:
 * 1. Detect file format from extension/MIME or auto-detect
 * 2. Parse file into rows/records
 * 3. Analyze column headers to map to RideLogDoc fields
 * 4. Return structured data with mapped fields and confidence scores
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImportFile = void 0;
const https_1 = require("firebase-functions/v2/https");
const papaparse_1 = __importDefault(require("papaparse"));
const XLSX = __importStar(require("xlsx"));
// ============================================
// Field Mapping Intelligence
// ============================================
/**
 * Known column name patterns for each TrackR field.
 * Lowercase, trimmed. Ordered by specificity.
 */
const FIELD_PATTERNS = {
    coasterName: [
        'coaster', 'coaster name', 'coaster_name', 'coastername',
        'ride', 'ride name', 'ride_name', 'ridename',
        'attraction', 'attraction name', 'attraction_name',
        'name', 'title',
    ],
    parkName: [
        'park', 'park name', 'park_name', 'parkname',
        'theme park', 'theme_park', 'themepark',
        'location', 'venue',
    ],
    date: [
        'date', 'ride date', 'ride_date', 'ridedate',
        'timestamp', 'time', 'datetime', 'date_time',
        'logged', 'logged at', 'logged_at',
        'when', 'visited', 'visit date', 'visit_date',
    ],
    rating: [
        'rating', 'score', 'stars',
        'my rating', 'my_rating', 'myrating',
        'overall', 'overall rating', 'overall_rating',
        'grade', 'rank',
    ],
    seat: [
        'seat', 'seat position', 'seat_position', 'seatposition',
        'row', 'seat row', 'seat_row',
        'position', 'seating',
    ],
    notes: [
        'notes', 'note', 'comments', 'comment',
        'review', 'description', 'thoughts',
        'memo', 'remarks',
    ],
    rideCount: [
        'count', 'ride count', 'ride_count', 'ridecount',
        'times', 'rides', 'number of rides', 'num rides',
        'quantity', 'qty', 'laps',
    ],
};
/**
 * Match a column header to a TrackR field.
 * Returns the field name and confidence (0-1).
 */
function matchColumnToField(columnName) {
    const normalized = columnName.toLowerCase().trim();
    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
        for (let i = 0; i < patterns.length; i++) {
            if (normalized === patterns[i]) {
                // Exact match — higher confidence for earlier patterns (more specific)
                const confidence = 1.0 - i * 0.02;
                return { field, confidence: Math.max(confidence, 0.7) };
            }
        }
    }
    // Partial match — check if any pattern is contained in the column name
    for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
        for (const pattern of patterns) {
            if (normalized.includes(pattern) || pattern.includes(normalized)) {
                return { field, confidence: 0.6 };
            }
        }
    }
    return null;
}
// ============================================
// Date Parsing
// ============================================
/**
 * Attempt to parse a date string into ISO 8601.
 * Handles common formats: MM/DD/YYYY, YYYY-MM-DD, DD/MM/YYYY, etc.
 */
function parseDate(raw) {
    if (!raw || typeof raw !== 'string')
        return null;
    const trimmed = raw.trim();
    if (!trimmed)
        return null;
    // Already ISO 8601
    if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(trimmed)) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime()))
            return d.toISOString();
    }
    // MM/DD/YYYY or M/D/YYYY
    const usDate = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (usDate) {
        const [, month, day, year] = usDate;
        const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(d.getTime()))
            return d.toISOString();
    }
    // YYYY/MM/DD
    const isoSlash = trimmed.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
    if (isoSlash) {
        const [, year, month, day] = isoSlash;
        const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(d.getTime()))
            return d.toISOString();
    }
    // Month name formats: "March 5, 2024", "5 Mar 2024", etc.
    const d = new Date(trimmed);
    if (!isNaN(d.getTime()))
        return d.toISOString();
    // Excel serial date number
    const serial = parseFloat(trimmed);
    if (!isNaN(serial) && serial > 25000 && serial < 55000) {
        // Excel date serial: days since 1900-01-01 (with the leap year bug)
        const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
        const date = new Date(excelEpoch.getTime() + serial * 86400000);
        if (!isNaN(date.getTime()))
            return date.toISOString();
    }
    return null;
}
function parseCSV(content) {
    const result = papaparse_1.default.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Keep everything as strings for consistent handling
    });
    const headers = result.meta.fields ?? [];
    return { headers, rows: result.data };
}
function parseTSV(content) {
    const result = papaparse_1.default.parse(content, {
        header: true,
        skipEmptyLines: true,
        delimiter: '\t',
        dynamicTyping: false,
    });
    const headers = result.meta.fields ?? [];
    return { headers, rows: result.data };
}
function parseExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet)
        throw new Error('Empty workbook');
    const sheet = workbook.Sheets[firstSheet];
    const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const headers = jsonRows.length > 0 ? Object.keys(jsonRows[0]) : [];
    return { headers, rows: jsonRows };
}
function parseJSON(content) {
    const parsed = JSON.parse(content);
    // Handle array of objects
    if (Array.isArray(parsed)) {
        if (parsed.length === 0)
            return { headers: [], rows: [] };
        const headers = Object.keys(parsed[0]);
        return { headers, rows: parsed };
    }
    // Handle object with a "rides" or "data" or "logs" array
    for (const key of ['rides', 'data', 'logs', 'entries', 'records']) {
        if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
            const headers = Object.keys(parsed[key][0]);
            return { headers, rows: parsed[key] };
        }
    }
    throw new Error('JSON must be an array of objects, or an object with a "rides", "data", or "logs" array.');
}
// ============================================
// Format Detection
// ============================================
function detectFormat(fileExtension, content) {
    const ext = fileExtension.toLowerCase().replace(/^\./, '');
    if (['xlsx', 'xls'].includes(ext))
        return 'excel';
    if (ext === 'csv')
        return 'csv';
    if (ext === 'tsv')
        return 'tsv';
    if (ext === 'json')
        return 'json';
    // Auto-detect from content
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('['))
        return 'json';
    if (trimmed.includes('\t') && !trimmed.includes(','))
        return 'tsv';
    if (trimmed.includes(','))
        return 'csv';
    return 'unknown';
}
// ============================================
// Main Cloud Function
// ============================================
exports.processImportFile = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const data = request.data;
    if (!data.fileBase64 || !data.fileName) {
        throw new https_1.HttpsError('invalid-argument', 'fileBase64 and fileName are required.');
    }
    const buffer = Buffer.from(data.fileBase64, 'base64');
    const content = buffer.toString('utf-8');
    const format = detectFormat(data.fileExtension ?? '', content);
    const warnings = [];
    // Parse file
    let headers;
    let rows;
    try {
        switch (format) {
            case 'csv':
                ({ headers, rows } = parseCSV(content));
                break;
            case 'tsv':
                ({ headers, rows } = parseTSV(content));
                break;
            case 'excel':
                ({ headers, rows } = parseExcel(buffer));
                break;
            case 'json':
                ({ headers, rows } = parseJSON(content));
                break;
            default:
                // Try CSV as last resort
                try {
                    ({ headers, rows } = parseCSV(content));
                    if (headers.length > 0 && rows.length > 0) {
                        warnings.push('File format was unrecognized. Attempted to parse as CSV.');
                    }
                    else {
                        throw new https_1.HttpsError('invalid-argument', "We couldn't read this file. Try exporting as CSV or Excel.");
                    }
                }
                catch {
                    throw new https_1.HttpsError('invalid-argument', "We couldn't read this file. Try exporting as CSV or Excel.");
                }
        }
    }
    catch (e) {
        if (e instanceof https_1.HttpsError)
            throw e;
        throw new https_1.HttpsError('invalid-argument', `Failed to parse file: ${e.message}`);
    }
    if (rows.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'File contains no data rows.');
    }
    // Map columns to TrackR fields
    const fieldMapping = {};
    const assignedFields = new Set();
    for (const header of headers) {
        const match = matchColumnToField(header);
        if (match && !assignedFields.has(match.field)) {
            fieldMapping[header] = match.field;
            assignedFields.add(match.field);
        }
    }
    // Warn about unmapped columns
    for (const header of headers) {
        if (!fieldMapping[header]) {
            warnings.push(`Column "${header}" has no TrackR equivalent — skipped.`);
        }
    }
    // Check for required field
    if (!assignedFields.has('coasterName')) {
        throw new https_1.HttpsError('invalid-argument', 'Could not identify a coaster name column. Please ensure your file has a column for coaster/ride names.');
    }
    // Build reverse mapping: field → column header
    const reverseMap = {};
    for (const [col, field] of Object.entries(fieldMapping)) {
        reverseMap[field] = col;
    }
    // Extract rides
    const rides = [];
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rawCoasterName = getString(row, reverseMap.coasterName);
        if (!rawCoasterName) {
            warnings.push(`Row ${i + 1}: Missing coaster name — skipped.`);
            continue;
        }
        const rawDate = getString(row, reverseMap.date);
        const rawRideCountStr = getString(row, reverseMap.rideCount);
        let rawRideCount = 1;
        if (rawRideCountStr) {
            const parsed = parseInt(rawRideCountStr, 10);
            if (!isNaN(parsed) && parsed > 0) {
                rawRideCount = parsed;
            }
        }
        rides.push({
            rawCoasterName,
            rawParkName: getString(row, reverseMap.parkName),
            rawDate,
            parsedDate: rawDate ? parseDate(rawDate) : null,
            rawRating: getString(row, reverseMap.rating),
            rawSeat: getString(row, reverseMap.seat),
            rawNotes: getString(row, reverseMap.notes),
            rawRideCount: rawRideCount,
            rowIndex: i,
        });
    }
    if (rides.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'No valid ride entries found in the file.');
    }
    // Warn about unparseable dates
    const unparsedDates = rides.filter((r) => r.rawDate && !r.parsedDate).length;
    if (unparsedDates > 0) {
        warnings.push(`${unparsedDates} date(s) could not be parsed and will need manual entry.`);
    }
    console.log(`[processImportFile] User ${request.auth.uid}: ${rides.length} rides parsed from ${format} file "${data.fileName}"`);
    return {
        rides,
        fieldMapping,
        warnings,
        sourceFormat: format === 'unknown' ? 'csv' : format, // If we fell through to CSV
    };
});
// ============================================
// Helpers
// ============================================
function getString(row, column) {
    if (!column)
        return null;
    const val = row[column];
    if (val == null)
        return null;
    const str = String(val).trim();
    return str.length > 0 ? str : null;
}
//# sourceMappingURL=processImportFile.js.map