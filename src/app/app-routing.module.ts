import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { amProposalComponent } from './proposal.component';
import { amEditProposalComponent } from './edit-proposal.component';
import { amEditQAComponent } from './edit-q-a.component';
import { amProposalsComponent } from './proposals.component';
import { amProfileComponent } from './profile.component';
import { amEditProfileComponent } from './edit-profile.component';
import { amLoginComponent } from './login.component';
import { amRegisterComponent } from './register.component';
import { amAlertComponent } from './alert.component';
import { amHelpComponent } from './help.component';

const routes: Routes = [
  { path: 'proposal/:id', component: amProposalComponent },
  { path: 'edit/proposal/:id', component: amEditProposalComponent },
  { path: 'edit/q_a/:id', component: amEditQAComponent },
  { path: 'proposals', component: amProposalsComponent },
  { path: 'profile/:sn', component: amProfileComponent },
  { path: 'profile', component: amProfileComponent },
  { path: 'edit/profile', component: amEditProfileComponent },  
  { path: 'login', component: amLoginComponent },
  { path: 'register', component: amRegisterComponent },
  { path: 'help', component: amHelpComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class amRoutingModule { }

export const routedComponents = [amProposalComponent, amProfileComponent, amEditProfileComponent, 
  amProposalsComponent, amEditProposalComponent, amEditQAComponent, amLoginComponent,
  amRegisterComponent, amAlertComponent, amHelpComponent];
