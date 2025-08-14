import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './about.component';
import { AbcComponent } from './abc/abc.component';
import { AbcdefComponent } from './abcdegf/abcdef.component';

const routes: Routes = [
  {
    path: '',
    component: AboutComponent,
  },
  {
    path: 'abc',
    component: AbcComponent,
  },
  {
    path: 'abcdef',
    component: AbcdefComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AboutRoutingModule { }
