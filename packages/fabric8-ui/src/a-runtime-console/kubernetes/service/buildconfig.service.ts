import { Inject, Injectable } from '@angular/core';
import { Restangular } from 'ngx-restangular';
import { BuildConfig, BuildConfigs } from '../model/buildconfig.model';
import { pathJoin } from '../model/utils';
import { APIsStore, isOpenShift } from '../store/apis.store';
import { DevNamespaceScope } from './devnamespace.scope';
import { KUBERNETES_RESTANGULAR } from './kubernetes.restangular';
import { NamespacedResourceService } from './namespaced.resource.service';
import { WatcherFactory } from './watcher-factory.service';

export function getOpenShiftBuildUriPrefix() {
  return isOpenShift() ? '/oapi/v1/namespaces/' : '/apis/build.openshift.io/v1/namespaces/';
}

@Injectable()
export class BuildConfigService extends NamespacedResourceService<BuildConfig, BuildConfigs> {
  constructor(
    @Inject(KUBERNETES_RESTANGULAR) kubernetesRestangular: Restangular,
    namespaceScope: DevNamespaceScope,
    private apiStore: APIsStore,
    watcherFactory: WatcherFactory,
  ) {
    super(
      kubernetesRestangular,
      namespaceScope,
      '/buildconfigs',
      watcherFactory,
      getOpenShiftBuildUriPrefix(),
    );

    apiStore.loading.subscribe((loading) => {
      if (!loading) {
        // force recalculation of the URL
        this._serviceUrl = null;
      }
    });
  }

  instantiate(buildConfig: BuildConfig) {
    const name = buildConfig.name;
    const namespace = buildConfig.namespace;
    const body = { kind: 'BuildRequest', apiVersion: 'v1', metadata: { name } };
    const url = this.serviceUrlForNamespace(namespace);
    return this.restangularService.one(url, `${name}/instantiate`).customPOST(body);
  }

  protected createServiceUrl(urlPrefix: string, namespace: string, urlSuffix: string): string {
    if (namespace) {
      if (this.apiStore.isOpenShift()) {
        return super.createServiceUrl(urlPrefix, namespace, urlSuffix);
      }
      return pathJoin(
        '/api/v1/proxy/namespaces',
        namespace,
        '/services/jenkinshift:80/oapi/v1/namespaces/',
        namespace,
        '/buildconfigs',
      );
    }
    return '';
  }
}
