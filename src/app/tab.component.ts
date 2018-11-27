import { Component, Input, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { amGlobalService } from './global.service';
import { amAlertService } from './alert.service';

@Component({
  selector: 'tab',
  template: `
    <div [hidden]="!active" class="pane">
      <ng-content></ng-content>
    </div>
  `
})
export class Tab {
  @Input('tabTitle') title: string;
  @Input() active = false;
}
@Component({
  selector: 'tabs',
  template: `
    <ul class="nav nav-tabs">
    <li class="nav-item" *ngFor="let tab of tabs" (click)="selectTab(tab)">
      <a [class]="'nav-link' + (tab.active ? ' active' : '')">{{tab.title}}</a>
    </li>
    </ul>
    <ng-content></ng-content>
  `
})
export class Tabs implements AfterContentInit {
    @ContentChildren(Tab) tabs: QueryList<Tab>;

  constructor(private alertService: amAlertService,
    private globalService: amGlobalService) { }

  ngAfterContentInit() {
    if (this.tabs.first) {
      let activeTabs = this.tabs.filter((tab) => tab.active);
      if (activeTabs.length === 0)
        this.selectTab(this.tabs.first);
    }
  }

  selectTab(tab: Tab) {
    this.tabs.toArray().forEach(tab => tab.active = false);
    tab.active = true;
    this.globalService.activeTab = tab.title;
    this.alertService.clear();
  }
}
