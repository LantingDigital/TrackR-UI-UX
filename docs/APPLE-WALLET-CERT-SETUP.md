# Apple Wallet Certificate Setup for TrackR

The PKPass Cloud Function is fully built and deployed. It just needs real signing certificates to produce valid Apple Wallet passes. This is a one-time manual setup.

## Prerequisites

- Apple Developer account (Team ID: Q9H59NQ25W) -- ACTIVE
- macOS with Keychain Access
- Firebase CLI with access to `trackr-coaster-app`
- OpenSSL (comes with macOS)

## Step 1: Register Pass Type ID

1. Go to https://developer.apple.com/account/resources/identifiers/list/passTypeId
2. Click the (+) button
3. Select "Pass Type IDs" and click Continue
4. Enter:
   - Description: `TrackR Wallet Pass`
   - Identifier: `pass.com.lantingdigital.trackr`
5. Click Register

## Step 2: Create Certificate for Pass Type ID

1. In the Identifiers list, click on `pass.com.lantingdigital.trackr`
2. Click "Create Certificate"
3. You need a Certificate Signing Request (CSR):
   - Open Keychain Access on your Mac
   - Menu: Keychain Access > Certificate Assistant > Request a Certificate From a Certificate Authority
   - Enter your email (caleb@lantingdigital.com)
   - Select "Saved to disk"
   - Save the .certSigningRequest file
4. Upload the CSR file on the Apple Developer portal
5. Click Continue, then Download the certificate (.cer file)

## Step 3: Export as .p12

1. Double-click the downloaded .cer file to install it in Keychain Access
2. In Keychain Access, find the certificate (search "pass.com.lantingdigital.trackr")
3. Right-click the certificate > Export
4. Choose format: Personal Information Exchange (.p12)
5. Save as `trackr-pass-cert.p12`
6. Set a passphrase when prompted (remember this -- you will need it in Step 6)

## Step 4: Convert .p12 to PEM Files

Open Terminal and run:

```bash
# Extract the certificate (public key)
openssl pkcs12 -in trackr-pass-cert.p12 -clcerts -nokeys -out pass-type-id.pem

# Extract the private key
openssl pkcs12 -in trackr-pass-cert.p12 -nocerts -out pass-type-id-key.pem
```

You will be prompted for the .p12 passphrase from Step 3, and then asked to set a PEM passphrase for the private key.

## Step 5: Download Apple WWDR Certificate

The Apple Worldwide Developer Relations (WWDR) intermediate certificate is required for signing.

1. Go to https://www.apple.com/certificateauthority/
2. Download "Apple Worldwide Developer Relations Certification Authority - G4"
   (Direct link: https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer)
3. Convert from DER to PEM format:

```bash
openssl x509 -in AppleWWDRCAG4.cer -inform DER -out wwdr.pem -outform PEM
```

## Step 6: Upload PEM Files to Cloud Storage

Upload all three PEM files to the Firebase Cloud Storage bucket:

```bash
# Using gsutil (comes with gcloud CLI)
gsutil cp wwdr.pem gs://trackr-coaster-app.appspot.com/apple-wallet-certs/wwdr.pem
gsutil cp pass-type-id.pem gs://trackr-coaster-app.appspot.com/apple-wallet-certs/pass-type-id.pem
gsutil cp pass-type-id-key.pem gs://trackr-coaster-app.appspot.com/apple-wallet-certs/pass-type-id-key.pem
```

Or use the Firebase Console: Storage > trackr-coaster-app.appspot.com > Create folder "apple-wallet-certs" > Upload files.

## Step 7: Set Certificate Passphrase as Secret

The Cloud Function reads the private key passphrase from an environment variable:

```bash
# For Cloud Functions v2 (Firebase Functions v6+)
firebase functions:secrets:set WALLET_CERT_PASSPHRASE --project trackr-coaster-app
# Enter the PEM passphrase you set in Step 4 when prompted
```

Then redeploy the functions so they pick up the new secret:

```bash
firebase deploy --only functions:generatePKPass --project trackr-coaster-app
```

## Verification

After setup, test by calling the generatePKPass function from the app or Firebase console. It should:
1. Load certs from Cloud Storage
2. Build a signed .pkpass file
3. Upload to Cloud Storage
4. Return a signed download URL

The .pkpass file should open in Apple Wallet on an iPhone or the Wallet simulator.

## Certificate Renewal

Pass Type ID certificates expire after 1 year. Set a reminder to renew before expiry. The process is the same as Steps 2-7 (re-create certificate, re-export, re-upload).

## Files Reference

| File | Cloud Storage Path | Purpose |
|------|-------------------|---------|
| wwdr.pem | apple-wallet-certs/wwdr.pem | Apple WWDR G4 intermediate cert |
| pass-type-id.pem | apple-wallet-certs/pass-type-id.pem | Pass Type ID certificate (public) |
| pass-type-id-key.pem | apple-wallet-certs/pass-type-id-key.pem | Pass Type ID private key |

Code reference: `functions/src/wallet/passBuilder.ts` (lines 41-51 define the expected paths and identifiers).
