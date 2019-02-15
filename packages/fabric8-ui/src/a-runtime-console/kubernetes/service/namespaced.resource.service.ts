import { Restangular } from 'ngx-restangular';
import { empty as observableEmpty, Observable, Subscription } from 'rxjs';
import { KubernetesResource } from '../model/kubernetesresource.model';
import { pathJoin } from '../model/utils';
import { KubernetesService } from './kubernetes.service';
import { INamespaceScope } from './namespace.scope';
import { WatcherFactory } from './watcher-factory.service';

export abstract class NamespacedResourceService<
  T extends KubernetesResource,
  L extends Array<T>
> extends KubernetesService<T, L> {
  private namespaceSubscription: Subscription;

  private _namespace: string;

  protected _serviceUrl: string;

  constructor(
    kubernetesRestangular: Restangular,
    private namespaceScope: INamespaceScope,
    private urlSuffix: string,
    watcherFactory: WatcherFactory,
    private urlPrefix: string = '/api/v1/namespaces/',
  ) {
    super(kubernetesRestangular, watcherFactory);
    this.namespace = namespaceScope.currentNamespace();

    if (this.namespaceScope) {
      this.namespaceSubscription = this.namespaceScope.namespace.subscribe((namespace) => {
        this.namespace = namespace;
      });
    }
  }

  /**
   * Creates a watcher that can watch for events
   * @param queryParams
   */
  watchNamepace(namespace: string, queryParams: any = null) {
    if (namespace) {
      const listFactory = () => this.list(namespace, queryParams);
      return this.watcherFactory.newInstance(
        () => this.serviceUrlForNamespace(namespace),
        queryParams,
        listFactory,
      );
    }
    return this.watch(queryParams);
  }

  get namespace(): string {
    return this._namespace;
  }

  set namespace(namespace: string) {
    if (namespace && namespace != this._namespace) {
      this._namespace = namespace;
      this._serviceUrl = null;
      this.onNamespaceChanged();
    }
  }

  get(id: string, namespace: string = null): Observable<T> {
    const url = namespace ? this.serviceUrlForNamespace(namespace) : this.serviceUrl;
    return this.restangularService.one(url, id).get();
  }

  list(namespace: string = null, queryParams: any = null): Observable<L> {
    const url = namespace ? this.serviceUrlForNamespace(namespace) : this.serviceUrl;
    if (!url) {
      return observableEmpty();
    }
    return this.restangularService.all(url).getList(queryParams);
  }

  create(obj: T, namespace: string = null): Observable<T> {
    const url = this.urlForObject(obj, namespace);
    const resource = obj.resource || {};
    if (!resource.kind) {
      resource.kind = obj.defaultKind();
    }
    obj.updateResource(resource);

    return this.restangularService.all(url).post(resource);
  }

  delete(obj: T): any {
    const url = this.urlForObject(obj);
    const id = obj.name;
    if (id) {
      return this.restangularService.one(url, id).remove();
    }
    return super.delete(obj);
  }

  protected urlForObject(obj: T, namespace: string = '') {
    let ns = namespace;
    if (!ns) {
      ns = obj.namespace;
    }
    const url = ns ? this.serviceUrlForNamespace(ns) : this.serviceUrl;
    return url;
  }

  /**
   * Returns the service URL to use for the current namespace scope
   */
  get serviceUrl(): string {
    if (!this._serviceUrl) {
      this._serviceUrl = this.serviceUrlForNamespace(this.namespace);
    }
    return this._serviceUrl;
  }

  /**
   * Returns the base URL to use for the given namespace
   */
  protected serviceUrlForNamespace(namespace: string) {
    return this.createServiceUrl(this.urlPrefix, namespace, this.urlSuffix);
  }

  protected createServiceUrl(urlPrefix: string, namespace: string, urlSuffix: string): string {
    if (namespace) {
      const url = pathJoin(urlPrefix, namespace, urlSuffix);
      // console.log("setting url to: " + url);
      return url;
    }
    return '';
  }

  // TODO
  ngOnDestroy() {
    this.namespaceSubscription.unsubscribe();
  }

  protected onNamespaceChanged() {}
}
