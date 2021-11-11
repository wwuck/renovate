import { mocked } from '../../../test/util';
import * as _datasource from '../../datasource';
import {
  ToolConstraint,
  generateInstallCommands,
  resolveConstraint,
} from './buildpack';

jest.mock('../../../lib/datasource');

const datasource = mocked(_datasource);

describe('util/exec/buildpack', () => {
  describe('resolveConstraint()', () => {
    beforeEach(() => {
      datasource.getPkgReleases.mockResolvedValueOnce({
        releases: [
          { version: '1.0.0' },
          { version: '1.1.0' },
          { version: '1.3.0' },
          { version: '2.0.14' },
          { version: '2.1.0' },
        ],
      });
    });
    it('returns from config', async () => {
      expect(
        await resolveConstraint({ toolName: 'composer', constraint: '1.1.0' })
      ).toBe('1.1.0');
    });

    it('returns from latest', async () => {
      expect(await resolveConstraint({ toolName: 'composer' })).toBe('2.1.0');
    });

    it('throws for unknown tools', async () => {
      datasource.getPkgReleases.mockReset();
      datasource.getPkgReleases.mockResolvedValueOnce({
        releases: [],
      });
      await expect(resolveConstraint({ toolName: 'whoops' })).rejects.toThrow(
        'Invalid tool to install: whoops'
      );
    });

    it('throws no releases', async () => {
      datasource.getPkgReleases.mockReset();
      datasource.getPkgReleases.mockResolvedValueOnce({
        releases: [],
      });
      await expect(resolveConstraint({ toolName: 'composer' })).rejects.toThrow(
        'No tool releases found.'
      );
    });

    it('falls back to latest version if no compatible release', async () => {
      datasource.getPkgReleases.mockReset();
      datasource.getPkgReleases.mockResolvedValueOnce({
        releases: [{ version: '1.2.3' }],
      });
      expect(
        await resolveConstraint({ toolName: 'composer', constraint: '^3.1.0' })
      ).toBe('1.2.3');
    });

    it('falls back to latest version if invalid constraint', async () => {
      datasource.getPkgReleases.mockReset();
      datasource.getPkgReleases.mockResolvedValueOnce({
        releases: [{ version: '1.2.3' }],
      });
      expect(
        await resolveConstraint({ toolName: 'composer', constraint: 'whoops' })
      ).toBe('1.2.3');
    });
  });
  describe('generateInstallCommands()', () => {
    beforeEach(() => {
      datasource.getPkgReleases.mockResolvedValueOnce({
        releases: [
          { version: '1.0.0' },
          { version: '1.1.0' },
          { version: '1.3.0' },
          { version: '2.0.14' },
          { version: '2.1.0' },
        ],
      });
    });
    it('returns install commands', async () => {
      const toolConstraints: ToolConstraint[] = [
        {
          toolName: 'composer',
        },
      ];
      expect(await generateInstallCommands(toolConstraints))
        .toMatchInlineSnapshot(`
        Array [
          "install-tool composer 2.1.0",
        ]
      `);
    });
  });
});
