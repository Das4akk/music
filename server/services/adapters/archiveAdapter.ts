import { Track } from '../../../src/types/music.js';

export class ArchiveAdapter {
  readonly platform = 'free_archive' as const;

  async search(_query: string): Promise<Track[]> {
    return [];
  }

  getById(_id: string): Track | undefined {
    return undefined;
  }

  getAll(): Track[] {
    return [];
  }
}
