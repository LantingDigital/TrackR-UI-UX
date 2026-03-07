/**
 * Barcode Decoder Service
 *
 * JavaScript-based barcode decoder using @zxing/library with @shopify/react-native-skia
 * for pixel extraction. Handles all 1D and 2D barcode formats from screenshot images.
 *
 * This exists because expo-camera's scanFromURLAsync on iOS only reads QR codes
 * from images, not 1D barcodes. Screenshots are lossless, so JS decode success
 * rate should be very high.
 */

import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';
import {
  MultiFormatReader,
  BarcodeFormat as ZXingFormat,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  DecodeHintType,
  NotFoundException,
} from '@zxing/library';
import type { BarcodeFormat } from '../types/wallet';

interface DecodeResult {
  data: string;
  format: BarcodeFormat;
}

/**
 * Map ZXing format enum to our BarcodeFormat type
 */
const ZXING_TO_APP_FORMAT: Partial<Record<number, BarcodeFormat>> = {
  [ZXingFormat.QR_CODE]: 'QR_CODE',
  [ZXingFormat.AZTEC]: 'AZTEC',
  [ZXingFormat.PDF_417]: 'PDF417',
  [ZXingFormat.DATA_MATRIX]: 'DATA_MATRIX',
  [ZXingFormat.CODE_128]: 'CODE_128',
  [ZXingFormat.CODE_39]: 'CODE_39',
  [ZXingFormat.EAN_13]: 'EAN_13',
  [ZXingFormat.UPC_A]: 'UPC_A',
};

/**
 * All barcode formats we want to detect
 */
const SUPPORTED_FORMATS = [
  ZXingFormat.QR_CODE,
  ZXingFormat.AZTEC,
  ZXingFormat.PDF_417,
  ZXingFormat.DATA_MATRIX,
  ZXingFormat.CODE_128,
  ZXingFormat.CODE_39,
  ZXingFormat.EAN_13,
  ZXingFormat.UPC_A,
];

/**
 * Create a configured MultiFormatReader with hints for all supported formats
 */
function createReader(): MultiFormatReader {
  const reader = new MultiFormatReader();
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true);
  reader.setHints(hints);
  return reader;
}

/**
 * Convert RGBA pixel data (Uint8Array from Skia) to luminance values (Uint8ClampedArray)
 * Uses the standard luminance formula: L = 0.299*R + 0.587*G + 0.114*B
 */
function rgbaToLuminance(rgba: Uint8Array, pixelCount: number): Uint8ClampedArray {
  const luminance = new Uint8ClampedArray(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    const r = rgba[offset];
    const g = rgba[offset + 1];
    const b = rgba[offset + 2];
    // Standard luminance with integer math for speed
    luminance[i] = ((r * 77 + g * 150 + b * 29) >> 8) & 0xFF;
  }
  return luminance;
}

/**
 * Decode a barcode from an image URI using ZXing via Skia pixel extraction.
 *
 * @param uri - Local file URI or remote URL of the image
 * @returns Decoded data and format, or null if no barcode found
 */
export async function decodeFromImageUri(uri: string): Promise<DecodeResult | null> {
  try {
    // Load image data via Skia
    const data = await Skia.Data.fromURI(uri);
    const image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) {
      console.warn('barcodeDecoder: Failed to decode image from URI');
      return null;
    }

    const width = image.width();
    const height = image.height();

    // Read pixels as RGBA_8888
    const pixels = image.readPixels(0, 0, {
      width,
      height,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
    });

    if (!pixels || !(pixels instanceof Uint8Array)) {
      console.warn('barcodeDecoder: Failed to read pixels from image');
      return null;
    }

    // Convert RGBA to luminance for ZXing
    const pixelCount = width * height;
    const luminance = rgbaToLuminance(pixels, pixelCount);

    // Create ZXing bitmap and attempt decode
    const luminanceSource = new RGBLuminanceSource(luminance, width, height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    const reader = createReader();

    try {
      const result = reader.decode(binaryBitmap);
      const zxingFormat = result.getBarcodeFormat();
      const appFormat = ZXING_TO_APP_FORMAT[zxingFormat] || 'QR_CODE';
      const text = result.getText();

      if (text) {
        return { data: text, format: appFormat };
      }
    } catch (e) {
      if (!(e instanceof NotFoundException)) {
        console.warn('barcodeDecoder: Decode error:', e);
      }
    }

    // Try with inverted luminance (white-on-black barcodes)
    try {
      const invertedSource = luminanceSource.invert();
      const invertedBitmap = new BinaryBitmap(new HybridBinarizer(invertedSource));
      const reader2 = createReader();
      const result = reader2.decode(invertedBitmap);
      const zxingFormat = result.getBarcodeFormat();
      const appFormat = ZXING_TO_APP_FORMAT[zxingFormat] || 'QR_CODE';
      const text = result.getText();

      if (text) {
        return { data: text, format: appFormat };
      }
    } catch (e) {
      if (!(e instanceof NotFoundException)) {
        console.warn('barcodeDecoder: Inverted decode error:', e);
      }
    }

    return null;
  } catch (error) {
    console.error('barcodeDecoder: Unexpected error:', error);
    return null;
  }
}
