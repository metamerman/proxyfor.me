import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { amAppComponent } from './app.component';
import { amRoutingModule, routedComponents } from './app-routing.module';
import { amGlobalService } from './global.service';
import { amProposalService } from './proposal.service';
import { amProfileService } from './profile.service';
import { amEditService } from './edit.service';
import { amLoginService } from './login.service';
import { amAlertService } from './alert.service';
import { Tab, Tabs } from './tab.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    amRoutingModule
  ],
  declarations: [
    amAppComponent,
    Tab, Tabs,
    routedComponents
  ],
  providers: [
    amGlobalService,
    amProposalService,
    amProfileService,
    amEditService,
    amLoginService,
    amAlertService
  ],
  bootstrap: [amAppComponent]
})
export class AppModule { }