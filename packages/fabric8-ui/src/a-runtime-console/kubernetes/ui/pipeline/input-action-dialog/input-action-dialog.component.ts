import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Inject, Input, OnDestroy, ViewChild } from '@angular/core';
import { AuthenticationService } from 'ngx-login-client';
import { Observable, Subscription, timer as observableTimer } from 'rxjs';
import { JenkinsService } from '../../../../../app/shared/jenkins.service';
import { FABRIC8_FORGE_API_URL } from '../../../../../app/shared/runtime-console/fabric8-ui-forge-api';
import { Build, PendingInputAction } from '../../../model/build.model';
import { PipelineStage } from '../../../model/pipelinestage.model';
import { pathJoin } from '../../../model/utils';

@Component({
  selector: 'input-action-dialog',
  templateUrl: './input-action-dialog.component.html',
  styleUrls: ['./input-action-dialog.component.less'],
})
export class InputActionDialog implements OnDestroy {
  build: Build = new Build();

  stage: PipelineStage = null;

  inputAction: PendingInputAction = new PendingInputAction();

  @ViewChild('inputModal') modal: any;

  private _jenkinsSubscription: Subscription;

  private _jenkinsTimerSubscription: Subscription;

  private jenkinsStatus: any;

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService,
    private jenkinsService: JenkinsService,
    @Inject(FABRIC8_FORGE_API_URL) private forgeApiUrl: string,
  ) {}

  ngOnDestroy() {
    this.unsubscribeJenkinsSubscription();
  }

  get messageLines(): string[] {
    const msg = this.inputAction.message || '';
    return msg.split('\n');
  }

  open() {
    this.checkJenkinsStatus();
    this.modal.open();
  }

  proceed() {
    return this.invokeUrl(this.inputAction.proceedUrl);
  }

  abort() {
    return this.invokeUrl(this.inputAction.abortUrl);
  }

  invokeUrl(url: string) {
    let u = url;
    if (u) {
      if (u.startsWith('//')) {
        u = u.substring(1);
      }
      // lets replace URL which doesn't seem to work right ;)
      const postfix = '/wfapi/inputSubmit?inputId=Proceed';
      if (u.endsWith(postfix)) {
        u = `${u.substring(0, u.length - postfix.length)}/input/Proceed/proceedEmpty`;
      }

      const jenkinsNamespace = this.build.jenkinsNamespace;
      const forgeUrl = this.forgeApiUrl;
      if (!forgeUrl) {
        console.log('Warning no $FABRIC8_FORGE_API_URL environment variable!');
      } else if (!jenkinsNamespace) {
        console.log('Warning no jenkinsNamespace on the Build!');
      } else {
        u = pathJoin(forgeUrl, '/api/openshift/services/jenkins/', jenkinsNamespace, u);
        const headers = new HttpHeaders({
          Authorization: `Bearer ${this.authService.getToken()}`,
          'X-App': 'OSIO',
        });
        const body = null;
        this.http.post(u, body, { headers }).subscribe(() => {});
      }
    }
    this.close();
  }

  close() {
    this.modal.close();
  }

  checkJenkinsStatus() {
    this.jenkinsStatus = false;
    this.unsubscribeJenkinsSubscription();
    this._jenkinsTimerSubscription = observableTimer(0, 20000).subscribe((t) => {
      // stop polling after 6 minutes
      if (t <= 17) {
        this._jenkinsSubscription = this.jenkinsService.getJenkinsStatus().subscribe((status) => {
          if (status && status.data && status.data.state === 'running') {
            this.jenkinsStatus = true;
            this.unsubscribeJenkinsSubscription();
          } else {
            this.jenkinsStatus = false;
          }
        });
      } else {
        this.unsubscribeJenkinsSubscription();
      }
    });
  }

  unsubscribeJenkinsSubscription() {
    if (this._jenkinsSubscription) {
      this._jenkinsSubscription.unsubscribe();
    }
    if (this._jenkinsTimerSubscription) {
      this._jenkinsTimerSubscription.unsubscribe();
    }
  }
}
