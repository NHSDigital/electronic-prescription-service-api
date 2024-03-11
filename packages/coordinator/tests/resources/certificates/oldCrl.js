//  CertificateRevocationList {
//       tbsView: Uint8Array(344) [
//          48, 130,   1,  84,   2,   1,   1,  48,  13,   6,   9,  42,
//         134,  72, 134, 247,  13,   1,   1,  11,   5,   0,  48, 115,
//          49,  11,  48,   9,   6,   3,  85,   4,   6,  19,   2,  71,
//          66,  49,  14,  48,  12,   6,   3,  85,   4,   8,  12,   5,
//          76, 101, 101, 100, 115,  49,  14,  48,  12,   6,   3,  85,
//           4,   7,  12,   5,  76, 101, 101, 100, 115,  49,  12,  48,
//          10,   6,   3,  85,   4,  10,  12,   3, 110, 104, 115,  49,
//          20,  48,  18,   6,   3,  85,   4,  11,  12,  11,  69,  80,
//          83,  32,  77, 111,
//         ... 244 more items
//       ],
//       version: 1,
//       signature: AlgorithmIdentifier {
//         algorithmId: '1.2.840.113549.1.1.11',
//         algorithmParams: Null {
//           blockLength: 2,
//           error: '',
//           warnings: [],
//           valueBeforeDecodeView: [Uint8Array],
//           name: '',
//           optional: false,
//           idBlock: [LocalIdentificationBlock],
//           lenBlock: [LocalLengthBlock],
//           valueBlock: [ValueBlock]
//         }
//       },
//       issuer: RelativeDistinguishedNames {
//         typesAndValues: [
//           [AttributeTypeAndValue],
//           [AttributeTypeAndValue],
//           [AttributeTypeAndValue],
//           [AttributeTypeAndValue],
//           [AttributeTypeAndValue],
//           [AttributeTypeAndValue]
//         ],
//         valueBeforeDecode: ArrayBuffer {
//           [Uint8Contents]: <30 73 31 0b 30 09 06 03 55 04 06 13 02 47 42 31 0e 30 0c 06 03 55 04 08 0c 05 4c 65 65 64 73 31 0e 30 0c 06 03 55 04 07 0c 05 4c 65 65 64 73 31 0c 30 0a 06 03 55 04 0a 0c 03 6e 68 73 31 14 30 12 06 03 55 04 0b 0c 0b 45 50 53 20 4d 6f 63 6b 20 43 41 31 20 30 1e 06 03 55 04 03 0c 17 45 50 53 20 4d 6f ... 17 more bytes>,
//           byteLength: 117
//         }
//       },
//       thisUpdate: Time { type: 0, value: 2024-02-28T14:16:35.000Z },
//       signatureAlgorithm: AlgorithmIdentifier {
//         algorithmId: '1.2.840.113549.1.1.11',
//         algorithmParams: Null {
//           blockLength: 2,
//           error: '',
//           warnings: [],
//           valueBeforeDecodeView: [Uint8Array],
//           name: '',
//           optional: false,
//           idBlock: [LocalIdentificationBlock],
//           lenBlock: [LocalLengthBlock],
//           valueBlock: [ValueBlock]
//         }
//       },
//       signatureValue: BitString {
//         blockLength: 261,
//         error: '',
//         warnings: [],
//         valueBeforeDecodeView: Uint8Array(261) [
//             3, 130,   1,   1,   0, 130, 176, 228, 199,  39, 113, 247,
//           140, 109, 244,   4, 240,  44, 100, 142, 192,  42, 166, 127,
//            18, 238,  19, 195, 191,  99, 220, 102,  72, 253,  51, 147,
//           235, 244, 129,  94, 240,   0, 220,  32,  47,  50,  40, 176,
//           247, 254,  37, 132, 162, 121, 172,  59, 144,  28,  74, 208,
//            40,  61, 229, 133, 163,  59, 179,  38, 214, 227, 151,  78,
//            84,  73,   9,  47,   2, 110,  88, 255, 110, 140, 160,  15,
//           205, 192,  22,  78, 208, 154, 153,  27,  24, 252,  36,  52,
//            19, 131, 194,  58,
//           ... 161 more items
//         ],
//         name: '',
//         optional: false,
//         idBlock: LocalIdentificationBlock {
//           blockLength: 1,
//           error: '',
//           warnings: [],
//           valueBeforeDecodeView: Uint8Array(0) [],
//           isHexOnly: false,
//           valueHexView: Uint8Array(0) [],
//           tagClass: 1,
//           tagNumber: 3,
//           isConstructed: false
//         },
//         lenBlock: LocalLengthBlock {
//           blockLength: 3,
//           error: '',
//           warnings: [],
//           valueBeforeDecodeView: Uint8Array(0) [],
//           isIndefiniteForm: false,
//           longFormUsed: true,
//           length: 257
//         },
//         valueBlock: LocalBitStringValueBlock {
//           blockLength: 257,
//           error: '',
//           warnings: [],
//           valueBeforeDecodeView: Uint8Array(0) [],
//           value: [],
//           isIndefiniteForm: false,
//           isHexOnly: false,
//           valueHexView: [Uint8Array],
//           unusedBits: 0,
//           isConstructed: false
//         }
//       },
//       nextUpdate: Time { type: 0, value: 2034-02-25T14:16:35.000Z },
//       revokedCertificates: [
//         RevokedCertificate {
//           userCertificate: [Integer],
//           revocationDate: [Time],
//           crlEntryExtensions: [Extensions]
//         },
//         RevokedCertificate {
//           userCertificate: [Integer],
//           revocationDate: [Time],
//           crlEntryExtensions: [Extensions]
//         },
//         RevokedCertificate {
//           userCertificate: [Integer],
//           revocationDate: [Time],
//           crlEntryExtensions: [Extensions]
//         },
//         RevokedCertificate {
//           userCertificate: [Integer],
//           revocationDate: [Time],
//           crlEntryExtensions: [Extensions]
//         }
//       ],
//       crlExtensions: Extensions { extensions: [ [Extension] ] }
//     } crl here *****


//     RevokedCertificate {
//         userCertificate: Integer {
//           blockLength: 3,
//           error: '',
//           warnings: [],
//           valueBeforeDecodeView: Uint8Array(3) [ 2, 1, 3 ],
//           name: '',
//           optional: false,
//           idBlock: LocalIdentificationBlock {
//             blockLength: 1,
//             error: '',
//             warnings: [],
//             valueBeforeDecodeView: Uint8Array(0) [],
//             isHexOnly: false,
//             valueHexView: Uint8Array(0) [],
//             tagClass: 1,
//             tagNumber: 2,
//             isConstructed: false
//           },
//           lenBlock: LocalLengthBlock {
//             blockLength: 1,
//             error: '',
//             warnings: [],
//             valueBeforeDecodeView: Uint8Array(0) [],
//             isIndefiniteForm: false,
//             longFormUsed: false,
//             length: 1
//           },
//           valueBlock: LocalIntegerValueBlock {
//             blockLength: 1,
//             error: '',
//             warnings: [],
//             valueBeforeDecodeView: Uint8Array(0) [],
//             isHexOnly: false,
//             valueHexView: [Uint8Array],
//             _valueDec: 3
//           }
//         },
//         revocationDate: Time { type: 0, value: 2024-02-28T14:16:34.000Z },
//         crlEntryExtensions: Extensions { extensions: [ [Extension] ] }
//       } keyCompromisedCert here *****
