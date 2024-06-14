import { getPodModulePrefix } from './utils/layout-helpers';
import { ClassicPathMatcher, PodMatcher } from './utils/path-matcher';

export class BaseProject {
  private classicMatcher!: ClassicPathMatcher;
  private podMatcher!: PodMatcher;
  podModulePrefix = '';
  constructor(public readonly root: string) {
    const maybePrefix = getPodModulePrefix(root);

    if (maybePrefix) {
      this.podModulePrefix = 'app/' + maybePrefix;
    } else {
      this.podModulePrefix = 'app';
    }

    this.classicMatcher = new ClassicPathMatcher(this.root);
    this.podMatcher = new PodMatcher(this.root, this.podModulePrefix);
  }
  matchPathToType(filePath: string) {
    const item = this.classicMatcher.metaFromPath(filePath) || this.podMatcher.metaFromPath(filePath);

    if (item && filePath.toLowerCase().includes('/app/features/')) {
      item.name = 'feature' + filePath.split('/app/features')[1].replace('/components/', '/');
      item.name = item.name.split('/').slice(0, -1).join('/');
    }

    if (item && filePath.toLowerCase().includes('/app/shared/')) {
      item.name = 'shared/' + item.name;
    }

    return item;
  }
}
