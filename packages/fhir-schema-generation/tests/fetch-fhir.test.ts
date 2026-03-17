import * as fs from 'fs';
import * as tar from 'tar';

import { extractAndReadPackage, downloadSimplifierPackage } from '../src/utils/fetch-fhir.js';

jest.mock('fs');
jest.mock('tar');
jest.mock('stream/promises', () => ({
    finished: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('stream', () => ({
    Readable: { fromWeb: jest.fn().mockReturnValue({ pipe: jest.fn() }) },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('FHIR Package Downloader', () => {
    const mockRegistry = 'https://registry.example.com';
    const mockPackageName = 'test-package';

    let logSpy: jest.SpyInstance;
    let warningSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        // Suppress console logs/warns during clean test runs
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
        warningSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        logSpy.mockRestore()
        warningSpy.mockRestore()
    })

    describe('queryPackageVersion (via downloadSimplifierPackage)', () => {
        it('should resolve the latest version correctly', async () => {
            const mockMetadata = {
                'dist-tags': { latest: '1.0.1' },
                versions: {
                    '1.0.1': { version: '1.0.1', dist: { tarball: 'url-to-tarball' } }
                }
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockMetadata
            });

            // Mocking fs to trigger the "skip download" branch just to test version resolution quickly
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            await downloadSimplifierPackage(mockRegistry, mockPackageName, 'latest');
            expect(global.fetch).toHaveBeenCalledWith(`${mockRegistry}/${mockPackageName}`);
        });

        it('should throw an error if the version does not exist', async () => {
            const mockMetadata = {
                'dist-tags': { latest: '1.0.1' },
                versions: {
                    '1.0.5': { version: '1.0.5', dist: { tarball: 'url-to-tarball' } }
                }
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockMetadata
            });

            // Mocking fs to trigger the "skip download" branch just to test version resolution quickly
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            await expect(downloadSimplifierPackage(mockRegistry, mockPackageName, '22.22.22'))
                .rejects.toThrow('Version 22.22.22 not found in registry.');
        });

        it('should throw an error if latest version does not exist', async () => {
            const mockMetadata = {
                'dist-tags': { latest: '1.0.1' },
                versions: {
                    '1.0.5': { version: '1.0.5', dist: { tarball: 'url-to-tarball' } }
                }
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockMetadata
            });

            // Mocking fs to trigger the "skip download" branch just to test version resolution quickly
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            await expect(downloadSimplifierPackage(mockRegistry, mockPackageName, 'latest'))
                .rejects.toThrow('Version 1.0.1 not found in registry.');
        });

        it('should throw a warning if a later version is available', async () => {
            const mockMetadata = {
                'dist-tags': { latest: '1.0.15' },
                versions: {
                    '1.0.5': { version: '1.0.5', dist: { tarball: 'url-to-tarball' } },
                    '1.0.15': { version: '1.0.15', dist: { tarball: 'url-to-tarball' } }
                }
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockMetadata
            });

            // Mocking fs to trigger the "skip download" branch just to test version resolution quickly
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            await downloadSimplifierPackage(mockRegistry, mockPackageName, '1.0.5')
            expect(warningSpy).toHaveBeenCalled()
            expect(warningSpy).toHaveBeenCalledWith("A later version of this package is available", "1.0.15")
        });

        it('should throw an error if the fetch fails', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            await expect(downloadSimplifierPackage(mockRegistry, mockPackageName, 'latest'))
                .rejects.toThrow('Failed to fetch metadata: Not Found');
        });
    });

    describe('extractAndReadPackage', () => {
        const mockSource = 'test-file.tgz';
        const mockTarget = './extracted';

        it('should extract the tarball and read package.json', async () => {
            const mockPackageJson = { name: 'test-package', version: '1.0.0' };

            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(true)  // Target dir exists
                .mockReturnValueOnce(true); // package.json exists

            (fs.readFileSync as jest.Mock).mockReturnValueOnce(JSON.stringify(mockPackageJson));

            const result = await extractAndReadPackage(mockSource, mockTarget);

            expect(tar.x).toHaveBeenCalledWith({ file: mockSource, cwd: mockTarget });
            expect(result).toEqual(mockPackageJson);
        });

        it('should create target directory if it does not exist', async () => {
            const mockPackageJson = { name: 'test-package', version: '1.0.0' };
            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(false) // Target dir missing
                .mockReturnValueOnce(true); // package.json not missing (to not throw)

            (fs.readFileSync as jest.Mock).mockReturnValueOnce(JSON.stringify(mockPackageJson));

            await extractAndReadPackage(mockSource, mockTarget)
            expect(fs.mkdirSync).toHaveBeenCalledWith(mockTarget, { recursive: true });
        });

        it('should throw file does not exist', async () => {
            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(false) // Target dir missing
                .mockReturnValueOnce(false); // package.json missing (to trigger the throw)

            await expect(extractAndReadPackage(mockSource, mockTarget)).rejects.toThrow();
        });

        it('should throw an error if package.json is missing after extraction', async () => {
            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(true)  // Target dir exists
                .mockReturnValueOnce(false); // package.json missing

            await expect(extractAndReadPackage(mockSource, mockTarget))
                .rejects.toThrow(/Could not find expected 'package\/package.json'/);
        });
    });

    describe('downloadSimplifierPackage (Orchestration)', () => {
        it('should successfully orchestrate download and extraction', async () => {
            // Mock metadata response
            const mockMetadata = {
                version: '2.0.0',
                'dist-tags': { latest: '2.0.0' },
                versions: {
                    '2.0.0': { version: '2.0.0', dist: { tarball: 'http://tarball.url' } }
                }
            };

            // fetch 1: metadata, fetch 2: tarball
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({ ok: true, json: async () => mockMetadata })
                .mockResolvedValueOnce({ ok: true, body: 'mock-stream' });

            // Ensure directories don't exist to trigger creation, and skip cache
            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(false) // .output/raw missing
                .mockReturnValueOnce(false) // targetPath missing (skips cache)
                .mockReturnValueOnce(true)  // parsed dir exists (extractAndReadPackage)
                .mockReturnValueOnce(true); // package.json exists

            (fs.createWriteStream as jest.Mock).mockReturnValue('mock-write-stream');
            (fs.readFileSync as jest.Mock).mockReturnValue('{"name": "test", "version": "2.0.0"}');

            const result = await downloadSimplifierPackage(mockRegistry, mockPackageName, '2.0.0');

            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('raw'), { recursive: true });
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(tar.x).toHaveBeenCalled();
            expect(result).toEqual({ name: 'test', version: '2.0.0' });
        });

        it('should skip download if the target tarball already exists locally', async () => {
            const mockMetadata = {
                version: '2.0.0',
                'dist-tags': { latest: '2.0.0' },
                versions: {
                    '2.0.0': { version: '2.0.0', dist: { tarball: 'http://tarball.url' } }
                }
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockMetadata });

            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(true) // .output/raw exists
                .mockReturnValueOnce(true); // targetPath exists! -> returns early

            await downloadSimplifierPackage(mockRegistry, mockPackageName, '2.0.0');

            // Fetch should only be called once (for metadata), tarball download is skipped
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(tar.x).not.toHaveBeenCalled();
        });
    });
});