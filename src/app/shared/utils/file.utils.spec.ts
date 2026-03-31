import { FileUtils } from './file.utils';

describe('FileUtils', () => {
  describe('buildFilename', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Use local date constructor to avoid UTC/local offset issues
      jest.setSystemTime(new Date(2026, 2, 30)); // March 30, 2026 local time
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should build a csv filename with correct format', () => {
      const result = FileUtils.buildFilename('stock-report', 'csv');
      expect(result).toBe('stock-report-2026-03-30.csv');
    });

    it('should build an xlsx filename with correct format', () => {
      const result = FileUtils.buildFilename('movements-report', 'xlsx');
      expect(result).toBe('movements-report-2026-03-30.xlsx');
    });

    it('should zero-pad month and day', () => {
      jest.setSystemTime(new Date(2026, 0, 5)); // Jan 5, 2026 local
      const result = FileUtils.buildFilename('report', 'csv');
      expect(result).toBe('report-2026-01-05.csv');
    });

    it('should use the provided prefix in the filename', () => {
      const result = FileUtils.buildFilename('low-stock', 'xlsx');
      expect(result).toContain('low-stock');
      expect(result).toMatch(/\.xlsx$/);
    });
  });

  describe('downloadBlob', () => {
    let mockCreateObjectURL: jest.Mock;
    let mockRevokeObjectURL: jest.Mock;
    let createElementSpy: jest.SpyInstance;
    let mockAnchor: HTMLAnchorElement;
    let originalURL: typeof URL;

    beforeEach(() => {
      mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      } as unknown as HTMLAnchorElement;

      mockCreateObjectURL = jest.fn().mockReturnValue('blob:http://mock/url');
      mockRevokeObjectURL = jest.fn();

      // Save and replace URL on the window/global object
      originalURL = window.URL;
      Object.defineProperty(window, 'URL', {
        writable: true,
        value: {
          createObjectURL: mockCreateObjectURL,
          revokeObjectURL: mockRevokeObjectURL,
        },
      });

      createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    });

    afterEach(() => {
      Object.defineProperty(window, 'URL', { writable: true, value: originalURL });
      jest.restoreAllMocks();
    });

    it('should create an object URL from the blob', () => {
      const blob = new Blob(['test'], { type: 'text/csv' });
      FileUtils.downloadBlob(blob, 'test.csv');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    });

    it('should set the anchor download attribute to the filename', () => {
      const blob = new Blob(['test'], { type: 'text/csv' });
      FileUtils.downloadBlob(blob, 'my-file.csv');
      expect(mockAnchor.download).toBe('my-file.csv');
    });

    it('should click the anchor to trigger download', () => {
      const blob = new Blob(['test'], { type: 'text/csv' });
      FileUtils.downloadBlob(blob, 'test.csv');
      expect(mockAnchor.click).toHaveBeenCalled();
    });

    it('should revoke the object URL after download', () => {
      const blob = new Blob(['test'], { type: 'text/csv' });
      FileUtils.downloadBlob(blob, 'test.csv');
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://mock/url');
    });
  });
});
